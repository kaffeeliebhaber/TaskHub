import { join } from "node:path";
import { homedir } from "node:os";
import { Profiles } from "./service.mjs";

const dataDirectory = () => process.env.TASKHUB_DATA_DIR || join(process.env.XDG_DATA_HOME || join(homedir(), ".local/share"), "de.taskhub.desktop");

export function profilesPlugin() {
  let profiles;
  return {
    name: "taskhub-profiles",
    configureServer(server) {
      if (process.env.VITEST) return;
      profiles = new Profiles(join(dataDirectory(), "profiles.sqlite"));
      server.middlewares.use(async (request, response, next) => {
        if (!request.url?.startsWith("/api/")) return next();
        response.setHeader("Content-Type", "application/json");
        try {
          let body = {};
          if (request.method === "POST") { let raw = ""; for await (const chunk of request) raw += chunk; body = JSON.parse(raw || "{}"); }
          const cookies = Object.fromEntries((request.headers.cookie || "").split(";").filter(Boolean).map(value => value.trim().split("=")));
          let data;
          if (request.url === "/api/login") {
            const login = profiles.login(body.name, body.password);
            response.setHeader("Set-Cookie", `taskhub_session=${login.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
            data = login.user;
          } else if (request.url === "/api/logout") {
            profiles.logout(cookies.taskhub_session);
            response.setHeader("Set-Cookie", "taskhub_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"); data = true;
          } else {
            const userId = profiles.user(cookies.taskhub_session);
            if (request.url === "/api/me") data = profiles.public(userId);
            else if (request.url === "/api/workspace") data = request.method === "GET" ? profiles.load(userId) : profiles.save(userId, body);
            else if (request.url === "/api/members") data = profiles.membersFor(userId, body.boardId);
            else if (request.url === "/api/invite") data = profiles.invite(userId, body.boardId, body.userId);
            else if (request.url === "/api/users") data = profiles.createUser(body.name, body.password);
            else if (request.url === "/api/profile") data = profiles.profile(userId, body);
            else throw Error("Nicht gefunden.");
          }
          response.end(JSON.stringify(data));
        } catch (error) { response.statusCode = error.status || 400; response.end(JSON.stringify({ error: error.message || String(error) })); }
      });
    },
  };
}
