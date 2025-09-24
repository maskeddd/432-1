import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import {
	type ClipperOptions,
	ClipperOptionsSchema,
	type Segment,
	SegmentSchema,
} from "shared"

type SegmentWithId = Segment & { id: number; raw: string }

const API_URL = import.meta.env.VITE_API_URL

export default function App() {
	const [videoUrl, setVideoUrl] = useState<string | null>(null)
	const [videoFile, setVideoFile] = useState<File | null>(null)
	const [segments, setSegments] = useState<SegmentWithId[]>([])
	const [options, setOptions] = useState<ClipperOptions>({})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (file) {
			const url = URL.createObjectURL(file)
			setVideoUrl(url)
			setVideoFile(file)
		}
	}

	function handleAddSegment() {
		setSegments((prev) => [
			...prev,
			{ id: Date.now(), start: "", end: "", raw: "" },
		])
	}

	function handleRemoveSegment(id: number) {
		setSegments((prev) => prev.filter((seg) => seg.id !== id))
	}

	function handleSegmentChange(id: number, value: string) {
		setSegments((prev) =>
			prev.map((seg) => (seg.id === id ? { ...seg, raw: value } : seg))
		)
	}

	function handleSegmentBlur(id: number, value: string) {
		const match = value.match(/^([0-5]?\d:[0-5]\d)-([0-5]?\d:[0-5]\d)$/)
		if (!match) return

		const [, start, end] = match
		const parsed = SegmentSchema.safeParse({ start, end })

		if (parsed.success) {
			setSegments((prev) =>
				prev.map((seg) =>
					seg.id === id
						? { ...seg, ...parsed.data, raw: `${start}-${end}` }
						: seg
				)
			)
		}
	}

	function handleOptionChange<K extends keyof ClipperOptions>(
		key: K,
		value: ClipperOptions[K]
	) {
		const next = { ...options, [key]: value }
		const parsed = ClipperOptionsSchema.safeParse(next)
		if (parsed.success) {
			setOptions(parsed.data)
		} else {
			setOptions(next)
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setSuccess(null)

		const parsedSegments = segments
			.map((s) => ({ start: s.start, end: s.end }))
			.filter((s) => s.start && s.end)

		const segResults = parsedSegments.map((s) => SegmentSchema.safeParse(s))
		if (segResults.some((r) => !r.success)) {
			setError("One or more segments are invalid")
			setLoading(false)
			return
		}

		const optResult = ClipperOptionsSchema.safeParse(options)
		if (!optResult.success) {
			setError("Options are invalid")
			setLoading(false)
			return
		}

		try {
			const formData = new FormData()
			if (videoFile) {
				formData.append("video", videoFile)
			}
			formData.append("segments", JSON.stringify(parsedSegments))
			formData.append("options", JSON.stringify(optResult.data))

			const res = await fetch(`${API_URL}/clip`, {
				method: "POST",
				body: formData,
			})

			if (!res.ok) {
				throw new Error(`Server error: ${res.status}`)
			}

			const disposition = res.headers.get("Content-Disposition")
			let filename = "clip.mp4"
			if (disposition?.includes("filename=")) {
				filename = disposition.split("filename=")[1].replace(/"/g, "")
			}

			const blob = await res.blob()
			const url = URL.createObjectURL(blob)

			const a = document.createElement("a")
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			a.remove()
			URL.revokeObjectURL(url)

			setSuccess("Clip downloaded successfully!")
		} catch (err: unknown) {
			if (err instanceof Error) {
				setError(err.message)
			} else {
				setError(String(err))
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
				<legend className="fieldset-legend">Pick a File</legend>
				<input
					type="file"
					accept="video/*"
					className="file-input w-full"
					onChange={handleFileChange}
				/>
			</fieldset>

			{videoUrl && (
				<>
					<fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
						<legend className="fieldset-legend">Preview</legend>
						<video
							src={videoUrl}
							controls
							className="w-full max-h-[50vh] bg-black rounded-md object-contain"
						/>
					</fieldset>

					<div className="flex flex-col w-full lg:flex-row lg:gap-4">
						<fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full">
							<legend className="fieldset-legend">Segments</legend>

							{segments.map((segment, index) => (
								<div key={segment.id} className="mb-2">
									<label className="label mb-1">Segment {index + 1}</label>
									<div className="join w-full">
										<div className="flex-1">
											<label className="input validator join-item w-full">
												<input
													type="text"
													className="font-mono w-full"
													placeholder="00:01-00:05"
													pattern="([0-5]?\d:[0-5]\d)-([0-5]?\d:[0-5]\d)"
													required
													value={segment.raw}
													onChange={(e) =>
														handleSegmentChange(segment.id, e.target.value)
													}
													onBlur={(e) =>
														handleSegmentBlur(segment.id, e.target.value)
													}
												/>
											</label>
											<div className="validator-hint hidden">
												Enter a time range like 5:36-6:49
											</div>
										</div>
										<button
											type="button"
											onClick={() => handleRemoveSegment(segment.id)}
											className="btn btn-neutral btn-square join-item"
										>
											<Trash2 size={20} />
										</button>
									</div>
								</div>
							))}

							<button
								type="button"
								onClick={handleAddSegment}
								className="btn btn-neutral w-full"
							>
								<Plus size={20} />
								Add Segment
							</button>
						</fieldset>

						<fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4 w-full">
							<legend className="fieldset-legend">Options</legend>

							<label className="label">Speed</label>
							<input
								type="number"
								step="0.1"
								className="input input-bordered w-full"
								placeholder="1.0"
								value={options.speed ?? ""}
								onChange={(e) =>
									handleOptionChange(
										"speed",
										e.target.value === "" ? undefined : Number(e.target.value)
									)
								}
							/>

							<label className="label mt-2">Fade</label>
							<div className="flex gap-2 items-center">
								<input
									type="checkbox"
									checked={options.fade === true}
									onChange={(e) =>
										handleOptionChange("fade", e.target.checked || undefined)
									}
								/>
								<span>Enable Fade</span>
							</div>
							<input
								type="number"
								className="input input-bordered w-full mt-1"
								placeholder="duration (seconds)"
								value={typeof options.fade === "number" ? options.fade : ""}
								onChange={(e) =>
									handleOptionChange(
										"fade",
										e.target.value === "" ? undefined : Number(e.target.value)
									)
								}
							/>

							<label className="label mt-2">Resize</label>
							<input
								type="text"
								className="input input-bordered w-full"
								placeholder="1280x720"
								value={options.resize ?? ""}
								onChange={(e) =>
									handleOptionChange(
										"resize",
										e.target.value === "" ? undefined : e.target.value
									)
								}
							/>
						</fieldset>
					</div>

					<div className="mt-4">
						<button
							type="submit"
							className="btn btn-primary w-full"
							disabled={loading}
						>
							{loading ? "Processing..." : "submit"}
						</button>
						{error && <p className="text-error mt-2">{error}</p>}
						{success && <p className="text-success mt-2">{success}</p>}
					</div>
				</>
			)}
		</form>
	)
}
