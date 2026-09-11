import { describe, expect, test } from "bun:test"
import { publishingCaption, validateSchedule, validatePost } from "./validation"

const now = new Date("2030-01-01T00:00:00Z")
describe("Instagram scheduling", () => {
  test("keeps the selected instant in Sao Paulo and rejects past dates", () => {
    expect(
      validateSchedule(
        "2030-06-01T15:00:00Z",
        "America/Sao_Paulo",
        now,
      ).toISOString(),
    ).toBe("2030-06-01T15:00:00.000Z")
    expect(() => validateSchedule(now.toISOString(), "UTC", now)).toThrow(
      "SCHEDULE_IN_FUTURE",
    )
    expect(() =>
      validateSchedule("2030-06-01T15:00:00Z", "Invalid/Zone", now),
    ).toThrow("INVALID_SCHEDULE")
  })
  test("rejects repeated DST hours rather than silently choosing an occurrence", () => {
    expect(() =>
      validateSchedule("2030-11-03T05:30:00Z", "America/New_York", now),
    ).toThrow("INVALID_SCHEDULE")
    expect(() =>
      validateSchedule("2030-11-03T06:30:00Z", "America/New_York", now),
    ).toThrow("INVALID_SCHEDULE")
  })
  test("validates caption including appended hashtags", () => {
    expect(publishingCaption("Hello", ["#photo", "brand"])).toBe(
      "Hello\n\n#photo #brand",
    )
    expect(() => publishingCaption("x".repeat(2199), ["photo"])).toThrow(
      "CAPTION_TOO_LONG",
    )
    expect(() => publishingCaption("Hello", ["two words"])).toThrow(
      "INVALID_HASHTAG",
    )
  })
  test("accepts complete supported posts and rejects invalid carousel counts", () => {
    const post = {
      postType: "single",
      caption: "hello",
      hashtags: [],
      images: [{ url: "https://example.com/a.jpg" }],
    }
    expect(validatePost(post).images.length).toBe(1)
    expect(() => validatePost({ ...post, postType: "carousel" })).toThrow(
      "CAROUSEL_IMAGE_COUNT",
    )
    expect(() => validatePost({ ...post, postType: "reel" })).toThrow(
      "UNSUPPORTED_POST_TYPE",
    )
    expect(() => validatePost({ ...post, images: [] })).toThrow(
      "SINGLE_IMAGE_REQUIRED",
    )
    expect(() =>
      validatePost({
        ...post,
        postType: "carousel",
        images: Array(11).fill(post.images[0]),
      }),
    ).toThrow("CAROUSEL_IMAGE_COUNT")
  })
})
