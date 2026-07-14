import { afterEach, describe, expect, it } from "bun:test"
import {
	getBackendUrl,
	isLocalHostname,
	isYouTubeUrl,
	resolveAuthRedirectUrl,
} from "./url-helpers"

const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

afterEach(() => {
	if (originalBackendUrl === undefined) {
		delete process.env.NEXT_PUBLIC_BACKEND_URL
	} else {
		process.env.NEXT_PUBLIC_BACKEND_URL = originalBackendUrl
	}
})

describe("getBackendUrl", () => {
	it("falls back to the hosted API when the variable is missing", () => {
		delete process.env.NEXT_PUBLIC_BACKEND_URL
		expect(getBackendUrl()).toBe("https://api.supermemory.ai")
	})

	it("uses a configured backend and removes trailing slashes", () => {
		process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.example///"
		expect(getBackendUrl()).toBe("https://backend.example")
	})

	it("treats empty and whitespace-only values as missing", () => {
		process.env.NEXT_PUBLIC_BACKEND_URL = "   "
		expect(getBackendUrl()).toBe("https://api.supermemory.ai")
	})
})

describe("local host detection", () => {
	it("accepts browser-normalized IPv6 loopback hostnames", () => {
		const hostname = new URL("http://[::1]:3000/").hostname
		expect(hostname).toBe("[::1]")
		expect(isLocalHostname(hostname)).toBe(true)
	})

	it("maps IPv6 loopback auth redirects back to the public origin", () => {
		const redirected = resolveAuthRedirectUrl(
			"http://[::1]:3000/settings?tab=profile",
			"https://local.example",
		)
		expect(redirected.toString()).toBe(
			"https://local.example/settings?tab=profile",
		)
	})
})

describe("isYouTubeUrl", () => {
	it("matches canonical youtube.com watch URLs", () => {
		expect(isYouTubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true)
		expect(isYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
			true,
		)
	})

	it("matches real youtube subdomains", () => {
		expect(isYouTubeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true)
		expect(isYouTubeUrl("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
			true,
		)
	})

	it("matches youtu.be short links", () => {
		expect(isYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true)
		expect(isYouTubeUrl("https://www.youtu.be/dQw4w9WgXcQ")).toBe(true)
	})

	it("matches embed and shorts paths", () => {
		expect(isYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(true)
		expect(isYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
			true,
		)
	})

	it("is case-insensitive for scheme and host", () => {
		expect(isYouTubeUrl("HTTPS://youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true)
		expect(isYouTubeUrl("https://WWW.YOUTUBE.COM/watch?v=dQw4w9WgXcQ")).toBe(
			true,
		)
	})

	it("matches scheme-less URLs", () => {
		expect(isYouTubeUrl("youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true)
		expect(isYouTubeUrl("www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true)
	})

	it("rejects lookalike domains", () => {
		expect(isYouTubeUrl("https://notyoutube.com/watch?v=dQw4w9WgXcQ")).toBe(
			false,
		)
		expect(isYouTubeUrl("https://myyoutu.be/dQw4w9WgXcQ")).toBe(false)
	})

	it("rejects hosts that merely start with youtube.com", () => {
		expect(
			isYouTubeUrl("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"),
		).toBe(false)
		expect(isYouTubeUrl("https://youtu.be.evil.example/dQw4w9WgXcQ")).toBe(
			false,
		)
	})

	it("rejects URLs that only contain youtube.com in the path", () => {
		expect(
			isYouTubeUrl("https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ"),
		).toBe(false)
		expect(isYouTubeUrl("https://evil.example/redirect?to=youtu.be/x")).toBe(
			false,
		)
	})

	it("rejects empty and nullish input", () => {
		expect(isYouTubeUrl("")).toBe(false)
		expect(isYouTubeUrl(null)).toBe(false)
		expect(isYouTubeUrl(undefined)).toBe(false)
	})
})
