import {
	GetParameterCommand,
	GetParametersCommand,
	SSMClient,
} from "@aws-sdk/client-ssm"

export * from "./types/index.js"

const ssm = new SSMClient({ region: "ap-southeast-2" })

export async function getParameter(
	name: string,
	withDecryption = true
): Promise<string | null> {
	try {
		const command = new GetParameterCommand({
			Name: name,
			WithDecryption: withDecryption,
		})

		const response = await ssm.send(command)
		return response.Parameter?.Value ?? null
	} catch (err) {
		console.error(`Error fetching parameter: ${name}`, err)
		return null
	}
}

export async function getParameters<T extends Record<string, string>>(
	mapping: T
): Promise<{ [K in keyof T]: string | null }> {
	const names = Object.values(mapping)

	const command = new GetParametersCommand({
		Names: names,
	})

	try {
		const response = await ssm.send(command)

		const raw: Record<string, string | null> = {}
		response.Parameters?.forEach((param) => {
			if (param.Name) {
				raw[param.Name] = param.Value ?? null
			}
		})

		const result = {} as { [K in keyof T]: string | null }
		;(Object.keys(mapping) as (keyof T)[]).forEach((alias) => {
			const path = mapping[alias]
			result[alias] = raw[path] ?? null
		})

		return result
	} catch (err) {
		console.error("Error fetching SSM parameters", err)
		return Object.fromEntries(
			Object.keys(mapping).map((alias) => [alias, null])
		) as { [K in keyof T]: string | null }
	}
}
