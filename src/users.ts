import { readdirSync, unlinkSync } from "node:fs";
import { getUserAuthentication } from "./authorization";

export async function getUserDetailsRoute(request: Request) {
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

    const userFiles = readdirSync("./data/users");

    const users = new Map();

    for (const file of userFiles) {
        const user = await Bun.file(`./data/users/${file}`).json();
        users.set(user.username, user);
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

    if (body.username) {
        const user = users.get(body.username);
        if (!user) {
            return new Response(
                JSON.stringify({
                    error: { message: "User not found." },
                }),
                {
                    status: 404,
                }
            );
        }

        const map = new Map(Object.entries(user));

        map.delete("password");
        map.delete("sessions");

        return new Response(
            JSON.stringify({ data: Object.fromEntries(map.entries()) })
        );
    }

    const map = new Map(Object.entries(user));

    map.delete("password");
    map.delete("sessions");

    return new Response(
        JSON.stringify({ data: Object.fromEntries(map.entries()) })
    );
}

export async function updateUserDetailsRoute(request: Request) {
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

    const map = new Map(Object.entries(user));

    if (body.username) {
        const userFiles = readdirSync("./data/users");

        const users = new Map();

        for (const file of userFiles) {
            const user = await Bun.file(`./data/users/${file}`).json();
            users.set(user.username, user);
        }

        if (users.has(body.username)) {
            return new Response(
                JSON.stringify({
                    error: { message: "Username unavailable." },
                }),
                {
                    status: 400,
                }
            );
        }

        map.set("username", body.username);

        await Bun.write(
            `./data/users/${body.username}.json`,
            JSON.stringify(Object.fromEntries(map.entries()))
        );

        unlinkSync(`./data/users/${user.username}.json`);

        user.username = body.username;
    }

    if (body.email) {
        map.set("email", body.email);
    }

    if (body.name) {
        map.set("name", body.name);
    }

    await Bun.write(
        `./data/users/${user.username}.json`,
        JSON.stringify(Object.fromEntries(map.entries()))
    );

    map.delete("password");
    map.delete("sessions");

    return new Response(
        JSON.stringify({ data: Object.fromEntries(map.entries()) })
    );
}
