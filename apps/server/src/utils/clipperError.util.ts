export class ClipperError extends Error {
	public readonly exitCode: number
	public readonly stdout: string
	public readonly stderr: string

	constructor(
		message: string,
		exitCode: number,
		stdout: string,
		stderr: string
	) {
		super(message)
		this.name = "ClipperError"
		this.exitCode = exitCode
		this.stdout = stdout
		this.stderr = stderr
	}
}
