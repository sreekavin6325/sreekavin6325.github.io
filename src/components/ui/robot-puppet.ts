// Poses the Spline robot (see Robot.tsx) from code.
//
// The scene animates the robot by itself: an idle arm sway, and a LookAt behaviour
// that turns the head toward the cursor. The puppet overrides those joints every frame
// while it has something to show, easing toward a target pose, and hands control back
// to the scene once it returns to rest.
//
// Rig (from the scene): Bot > Top part > {Hand Instance (mirrored), Hand} > Hand LEFT
// (shoulder) > arm > elbow > forearm > Hand, plus Top part > Head. The two arms share
// joint names and, because one side is mirrored, the same local angles pose both
// sides symmetrically. Index 0 is the robot's right arm (screen left), 1 its left.

import type { Application, SPEObject } from "@splinetool/runtime";

type Vec3 = [number, number, number];

interface ArmPose {
  shoulder: Vec3;
  arm: Vec3;
  elbow: Vec3;
  forearm: Vec3;
}

type Arms = [ArmPose, ArmPose];

interface Pose {
  head: [number, number]; // [pitch (+ = down), yaw (+ = toward screen right)]
  arms: Arms | null; // null = leave the arms to the scene's idle sway
}

/** Arms hanging at the sides (the scene's rest angles). */
const REST_ARM: ArmPose = { shoulder: [0, 0, 0.09], arm: [0, 0, 0], elbow: [0, -0.14, 0], forearm: [0, 0, 0] };
/** Both hands up over the visor. */
const HIDE_ARM: ArmPose = { shoulder: [0, 0, 0.09], arm: [-1.4, -0.8, 0], elbow: [0, -0.14, 0], forearm: [-1.45, 0, 0.8] };
/** One hand raised beside the head, as if presenting something. */
const RAISED_ARM: ArmPose = { shoulder: [0, 0, 0.09], arm: [-1.4, 0, 0], elbow: [0, -0.14, 0], forearm: [-1.2, 0, 0.8] };

export type PuppetMode =
  | { kind: "idle" }
  /** Watch a point on screen (e.g. the caret of the field being typed in). */
  | { kind: "watch"; target: () => { x: number; y: number } | null }
  /** Cover its eyes with both hands. */
  | { kind: "hide" }
  /** Raise its left hand (screen right) to present something. */
  | { kind: "present" };

export interface Puppet {
  setMode: (mode: PuppetMode) => void;
  destroy: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

interface PuppetOptions {
  reducedMotion?: boolean;
  /** When false, the head never follows the cursor: at rest it faces forward. */
  followCursor?: boolean;
}

export function createPuppet(
  app: Application,
  container: HTMLElement,
  { reducedMotion = false, followCursor = true }: PuppetOptions = {},
): Puppet | null {
  const all = app.getAllObjects();
  const named = (name: string) => all.filter((o) => o.name === name);
  const head = all.find((o) => o.name === "Head");
  const joints = (["Hand LEFT", "arm", "elbow", "forearm"] as const).map(named);
  if (!head || joints.some((list) => list.length < 2)) return null; // not the expected rig

  const sides = [0, 1].map((i) => ({
    shoulder: joints[0][i],
    arm: joints[1][i],
    elbow: joints[2][i],
    forearm: joints[3][i],
  }));

  let mode: PuppetMode = { kind: "idle" };
  // What the puppet currently holds; null = the scene is in control of that part.
  let headNow: [number, number] | null = null;
  let armsNow: Arms | null = null;
  let frame = 0;

  const read = (o: SPEObject): Vec3 => [o.rotation.x, o.rotation.y, o.rotation.z];
  const snapshotArms = (): Arms =>
    sides.map((s) => ({
      shoulder: read(s.shoulder),
      arm: read(s.arm),
      elbow: read(s.elbow),
      forearm: read(s.forearm),
    })) as Arms;

  const headToward = (point: { x: number; y: number }): [number, number] => {
    const rect = container.getBoundingClientRect();
    const dx = point.x - (rect.left + rect.width / 2);
    const dy = point.y - (rect.top + rect.height * 0.2);
    return [clamp(dy / 600, -1, 1) * 0.5, clamp(dx / 700, -1, 1) * 0.8];
  };

  const targetPose = (): Pose | null => {
    switch (mode.kind) {
      case "watch": {
        const point = mode.target();
        return { head: point ? headToward(point) : [0.1, 0.3], arms: null };
      }
      case "hide":
        return { head: [0.35, 0], arms: [HIDE_ARM, HIDE_ARM] };
      case "present":
        return { head: [0, 0.25], arms: [REST_ARM, RAISED_ARM] };
      default:
        return null;
    }
  };

  const k = reducedMotion ? 1 : 0.12; // share of the remaining distance closed per frame
  const ease = (from: number, to: number) => from + (to - from) * k;
  const easeVec = (from: Vec3, to: Vec3): Vec3 => [ease(from[0], to[0]), ease(from[1], to[1]), ease(from[2], to[2])];
  const apply = (o: SPEObject, [x, y, z]: Vec3) => {
    o.rotation.x = x;
    o.rotation.y = y;
    o.rotation.z = z;
  };

  const tick = () => {
    frame = requestAnimationFrame(tick);
    const target = targetPose();

    // Head: follows the target; at rest either faces forward (held) or goes back to
    // the scene's cursor-following LookAt once it has eased to centre.
    const headGoal = target?.head ?? (followCursor ? null : ([0, 0] as [number, number]));
    if (headGoal || headNow) {
      headNow ??= [head.rotation.x, head.rotation.y];
      const goal = headGoal ?? [0, 0];
      headNow = [ease(headNow[0], goal[0]), ease(headNow[1], goal[1])];
      head.rotation.x = headNow[0];
      head.rotation.y = headNow[1];
      head.rotation.z = 0;
      if (!headGoal && Math.abs(headNow[0]) + Math.abs(headNow[1]) < 0.01) headNow = null;
    }

    // Arms: held only for poses that need them; otherwise eased back to rest and released
    // to the scene's idle sway.
    const armsGoal = target?.arms ?? null;
    if (armsGoal || armsNow) {
      armsNow ??= snapshotArms();
      const goal = armsGoal ?? ([REST_ARM, REST_ARM] as Arms);
      armsNow = armsNow.map((arm, i) => ({
        shoulder: easeVec(arm.shoulder, goal[i].shoulder),
        arm: easeVec(arm.arm, goal[i].arm),
        elbow: easeVec(arm.elbow, goal[i].elbow),
        forearm: easeVec(arm.forearm, goal[i].forearm),
      })) as Arms;
      sides.forEach((side, i) => {
        const pose = armsNow![i];
        apply(side.shoulder, pose.shoulder);
        apply(side.arm, pose.arm);
        apply(side.elbow, pose.elbow);
        apply(side.forearm, pose.forearm);
      });
      if (!armsGoal && armsNow.every((arm) => Math.abs(arm.arm[0]) + Math.abs(arm.arm[1]) + Math.abs(arm.forearm[0]) < 0.01)) {
        armsNow = null;
      }
    }
  };

  frame = requestAnimationFrame(tick);
  return {
    setMode: (next) => {
      mode = next;
    },
    destroy: () => cancelAnimationFrame(frame),
  };
}
