// loadtest.js
import fetch from "node-fetch"

// Config
const API_URL = "http://52.65.20.64:3001/process"
const FILENAME = "1756644688476-fakemink - Easter Pink (Prod Suzy Sheer).mp4"
const CONCURRENT_REQUESTS = 1
const TOTAL_REQUESTS = 10000
const TOKEN = null

async function sendRequest(i) {
	try {
		console.log(`Sending request #${i}...`)
		const res = await fetch(API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
			},
			body: JSON.stringify({
				filename: FILENAME,
				segments: [{ start: "00:01", end: "00:05" }],
				options: {},
			}),
		})

		const text = await res.text()
		console.log(`Request #${i} → ${res.status} ${text}`)
	} catch (err) {
		console.error(`Request #${i} failed:`, err.message)
	}
}

async function runLoadTest() {
	let running = []
	for (let i = 1; i <= TOTAL_REQUESTS; i++) {
		running.push(sendRequest(i))

		if (running.length >= CONCURRENT_REQUESTS) {
			await Promise.all(running)
			running = []
		}
	}
}

runLoadTest()
