import { expect, test } from "bun:test";
import { createMediaPlayback } from "../src/lib/media-playback";

test("registering or activating the same media does not interrupt it", () => {
  const playback = createMediaPlayback();
  let pauses = 0;
  let otherPauses = 0;
  const first = playback.register(() => pauses++);
  playback.register(() => otherPauses++);
  expect(otherPauses).toBe(0);
  expect(first.activate()).toBe(true);
  expect(first.activate()).toBe(true);
  expect(pauses).toBe(0);
  expect(otherPauses).toBe(1);
});

test("a new player pauses the previous one, including a remounting Instagram participant", () => {
  const playback = createMediaPlayback();
  const stopped: string[] = [];
  const instagram = playback.register(() => {
    stopped.push("instagram");
    instagram.unregister();
  });
  const youtube = playback.register(() => stopped.push("youtube"));
  instagram.activate();
  stopped.length = 0;
  youtube.activate();
  playback.pauseAll();
  expect(stopped).toEqual(["instagram", "youtube"]);
  expect(instagram.activate()).toBe(false);
});

test("a document pauses the current player and rejects delayed playback until it closes", () => {
  const playback = createMediaPlayback();
  let pauses = 0;
  const player = playback.register(() => pauses++);
  player.activate();
  const close = playback.suspend();
  expect(pauses).toBe(1);
  expect(playback.isSuspended()).toBe(true);
  expect(player.activate()).toBe(false);
  expect(pauses).toBe(2);
  close();
  expect(playback.isSuspended()).toBe(false);
  expect(pauses).toBe(2);
  expect(player.activate()).toBe(true);
});

test("nested document locks are independent and releasing them never resumes media", () => {
  const playback = createMediaPlayback();
  const first = playback.suspend();
  const second = playback.suspend();
  first();
  first();
  expect(playback.isSuspended()).toBe(true);
  second();
  expect(playback.isSuspended()).toBe(false);
  playback.pauseAll();
});

test("unmounting an old participant does not unregister the currently playing media", () => {
  const playback = createMediaPlayback();
  let pauses = 0;
  const first = playback.register(() => {});
  const current = playback.register(() => pauses++);
  first.activate();
  current.activate();
  pauses = 0;
  first.unregister();
  playback.pauseAll();
  expect(pauses).toBe(1);
  current.activate();
  current.unregister();
  playback.pauseAll();
  expect(pauses).toBe(1);
});

test("embed subscribers are notified only when entering or leaving document suspension", () => {
  const playback = createMediaPlayback();
  const states: boolean[] = [];
  const unsubscribe = playback.subscribe(() => states.push(playback.isSuspended()));
  const first = playback.suspend();
  const second = playback.suspend();
  first();
  second();
  second();
  expect(states).toEqual([true, false]);
  unsubscribe();
  playback.suspend()();
  expect(states).toEqual([true, false]);
});
