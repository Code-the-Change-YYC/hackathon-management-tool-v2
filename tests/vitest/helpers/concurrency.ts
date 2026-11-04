/** Starts all requests from the same gate and collects their settled results. */
export async function runConcurrently<T>(requests: (() => Promise<T>)[]) {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	const pending = requests.map(async (request) => {
		await gate;
		return request();
	});
	release();
	return Promise.allSettled(pending);
}
