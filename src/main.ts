import fs from "fs";
import path from "path";

import * as core from "@actions/core";

interface FileInfo
{
	name: string;
	contents: string;
	options: fs.WriteFileOptions;
}

/**
 * main function
 */
function main(): void
{
	try
	{
		const files: FileInfo[] = [
			{
				name: core.getInput("name"),
				contents: insertLf(core.getInput("key", {
					required: true,
				}), false, true),
				options: {
					mode: 0o400,
					flag: "ax",
				},
			},
			{
				name: "known_hosts",
				contents: insertLf(core.getInput("known_hosts"), true, true),
				options: {
					mode: 0o644,
					flag: "a",
				},
			},
			{
				name: "config",
				contents: insertLf(core.getInput("config"), true, true),
				options: {
					mode: 0o644,
					flag: "a",
				},
			},
		];

		// create ".ssh" directory
		const home = getHomeDirectory();
		const dirName = path.resolve(home, ".ssh");
		fs.mkdirSync(dirName, {
			recursive: true,
			mode: 0o700,
		});

		// create files
		for(const file of files)
		{
			const fileName = path.join(dirName, file.name);
			fs.writeFileSync(fileName, file.contents, file.options);
		}

		console.log(`SSH key has been stored to ${dirName} successfully.`);
	}
	catch(err)
	{
		core.setFailed(err.message);
	}
}

/**
 * get home directory
 * @returns home directory
 */
function getHomeDirectory(): string
{
	const homeEnv = getHomeEnv();
	const home = process.env[homeEnv];
	if(home === undefined)
	{
		throw Error(`${homeEnv} is not defined`);
	}

	if(home === "/github/home")
	{
		// Docker container
		return "/root";
	}

	return home;
}

/**
 * get HOME environment name
 * @returns HOME environment name
 */
function getHomeEnv(): string
{
	if(process.platform === "win32")
	{
		// Windows
		return "USERPROFILE";
	}

	// macOS / Linux
	return "HOME";
}

/**
 * prepend/append LF to value if not empty
 * @param value the value to insert LF
 * @param prepend true to prepend
 * @param append true to append
 * @returns new value
 */
function insertLf(value: string, prepend: boolean, append: boolean): string
{
	let affectedValue = value;

	if(value.length === 0)
	{
		// do nothing if empty
		return "";
	}
	if(prepend && !affectedValue.startsWith("\n"))
	{
		affectedValue = `\n${affectedValue}`;
	}
	if(append && !affectedValue.endsWith("\n"))
	{
		affectedValue = `${affectedValue}\n`;
	}

	return affectedValue;
}

main();
