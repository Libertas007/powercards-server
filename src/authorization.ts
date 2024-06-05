import { readdirSync } from "node:fs";
import type { UserFull } from "./types";

export async function signUpRoute(request: Request) {
    let body;

    try {
        body = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({
                error: { message: "Invalid JSON." },
            }),
            {
                status: 400,
            }
        );
    }

    if (!body.email || !body.password || !body.username) {
        return new Response(
            JSON.stringify({
                error: { body: "Email and password are required." },
            }),
            {
                status: 400,
            }
        );
    }

    const users = readdirSync("./data/users");
    if (users.map((e) => e.slice(0, -5)).includes(body.username)) {
        return new Response(
            JSON.stringify({
                error: { email: "Username is already taken." },
            }),
            {
                status: 400,
            }
        );
    }

    const session = generateSessionId();

    const userdata = {
        name: body.username,
        username: body.username,
        email: body.email,
        collections: [],
    };

    Bun.write(
        `./data/users/${body.username}.json`,
        JSON.stringify({
            ...userdata,
            sessions: [
                session +
                    "@" +
                    (Date.now() + 1000 * 60 * 60 * 24 * 21).toString(),
            ],
            password: Bun.password.hashSync(body.password),
        })
    );

    return new Response(
        JSON.stringify({ data: userdata, sessionId: session }),
        { status: 201 }
    );
}

export async function loginRoute(request: Request) {
    let body;

    try {
        body = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({
                error: { message: "Invalid JSON." },
            }),
            {
                status: 400,
            }
        );
    }

    if (!body.username || !body.password) {
        return new Response(
            JSON.stringify({
                error: { body: "Username and password are required." },
            }),
            {
                status: 400,
            }
        );
    }

    const users = readdirSync("./data/users");
    if (!users.map((e) => e.slice(0, -5)).includes(body.username)) {
        return new Response(
            JSON.stringify({
                error: { email: "User does not exist." },
            }),
            {
                status: 400,
            }
        );
    }

    const file = Bun.file(`./data/users/${body.username}.json`);

    const userdata = await file.json();

    if (!Bun.password.verifySync(body.password, userdata.password)) {
        return new Response(
            JSON.stringify({
                error: { password: "Incorrect password." },
            }),
            {
                status: 400,
            }
        );
    }

    const session = generateSessionId();
    userdata.sessions.push(
        session + "@" + (Date.now() + 1000 * 60 * 60 * 24 * 21).toString()
    );
    Bun.write(`./data/users/${body.username}.json`, JSON.stringify(userdata));

    const map = new Map(Object.entries(userdata));

    map.delete("password");
    map.delete("sessions");

    const responseData = Object.fromEntries(map.entries());

    return new Response(
        JSON.stringify({ data: responseData, sessionId: session }),
        { status: 200 }
    );
}

export async function changePasswordRoute(request: Request) {
    let body;

    try {
        body = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({
                error: { message: "Invalid JSON." },
            }),
            {
                status: 400,
            }
        );
    }

    if (!body.sessionId) {
        return new Response(
            JSON.stringify({
                error: { message: "Unauthorized." },
            }),
            {
                status: 401,
            }
        );
    }

    const user = await getUserAuthentication(body.sessionId);

    if (!user) {
        return new Response(
            JSON.stringify({
                error: { message: "Unauthorized." },
            }),
            {
                status: 401,
            }
        );
    }

    if (!body.oldPassword || !body.password) {
        return new Response(
            JSON.stringify({
                error: {
                    message: "Old password and current password are required.",
                },
            }),
            {
                status: 400,
            }
        );
    }

    if (!Bun.password.verifySync(body.oldPassword, user.password)) {
        return new Response(
            JSON.stringify({
                error: { message: "Incorrect password." },
            }),
            {
                status: 400,
            }
        );
    }

    const map = new Map(Object.entries(user));

    map.set("password", Bun.password.hashSync(body.password));

    const session = generateSessionId();

    map.set("sessions", [
        session + "@" + (Date.now() + 1000 * 60 * 60 * 24 * 21).toString(),
    ]);

    Bun.write(
        `./data/users/${user.username}.json`,
        JSON.stringify(Object.fromEntries(map.entries()))
    );

    map.delete("password");
    map.delete("sessions");

    return new Response(
        JSON.stringify({ data: Object.fromEntries(map), sessionId: session }),
        { status: 200 }
    );
}

export async function getUserAuthentication(
    sessionId: string
): Promise<UserFull | null> {
    const users = readdirSync("./data/users");

    const now = Date.now();

    for (const file of users) {
        const user = (await Bun.file(
            `./data/users/${file}`
        ).json()) as UserFull;
        for (const session of user.sessions) {
            const date = +session.split("@")[1];

            if (session.split("@")[0] === sessionId && date > now) {
                return user;
            }

            if (date < now) {
                user.sessions = user.sessions.filter((e) => e !== session);
                Bun.write(
                    `./data/users/${user.username}.json`,
                    JSON.stringify(user)
                );
            }
        }
    }

    return null;
}

export function generateSessionId(): string {
    const id = crypto.randomUUID() + crypto.randomUUID();

    return parseInt(id.replaceAll("-", ""), 16).toString(36);
}
