import { codejar } from "@pomdtr/smallweb-codejar";
import { lastlogin } from "@pomdtr/lastlogin";
import { getContext } from "@smallweb/ctx";

const { dir } = getContext();

const handler = codejar(dir);

export default {
    fetch: lastlogin(handler.fetch, {
        private: true,
        verifyEmail: (email) => {
            return email === Deno.env.get("EMAIL");
        },
    }),
};
