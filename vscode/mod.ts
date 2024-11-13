import { escape } from "@std/html";
import workbenchConfig from "./workbench.json" with { type: "json" };
import embeds from "./dist/mod.ts";

export type VSCodeConfig = {
    rootDir?: string;
};

export class VSCode {
    constructor(public config: VSCodeConfig = {}) {}

    fetch: (req: Request) => Response | Promise<Response> = async (
        req: Request,
    ) => {
        const url = new URL(req.url);
        if (url.pathname !== "/") {
            return new Response("Not found", { status: 404 });
        }

        const embed = await embeds.load("index.html");
        const content = await embed.text();

        return new Response(
            content.replace(
                "{{VSCODE_WORKBENCH_WEB_CONFIGURATION}}",
                escape(
                    JSON.stringify(workbenchConfig),
                ),
            ),
            {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                },
            },
        );
    };
}
