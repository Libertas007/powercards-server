import { readdirSync } from "node:fs";
import { getUserAuthentication } from "./authorization";

export async function getCollectionRoute(request: Request) {
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

    if (!body.id) {
        return new Response(
            JSON.stringify({
                error: { message: "Collection ID is required." },
            }),
            {
                status: 400,
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

    const collections = readdirSync(`./data/collections`);
    const collection = collections.find((e) => e === `${body.id}.json`);

    if (!collection) {
        return new Response(
            JSON.stringify({
                error: { message: "Collection not found." },
            }),
            {
                status: 404,
            }
        );
    }

    const data = await Bun.file(`./data/collections/${body.id}.json`).json();

    return new Response(JSON.stringify({ data }));
}

export async function updateCollectionRoute(request: Request) {
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

    if (!body.name || !body.cards || !Array.isArray(body.cards)) {
        return new Response(
            JSON.stringify({
                error: { message: "Collection name and cards are required." },
            }),
            {
                status: 400,
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

    if ((body.cards as String[][]).some((e: String[]) => !Array.isArray(e))) {
        return new Response(
            JSON.stringify({
                error: { message: "Cards must be an array of arrays." },
            }),
            {
                status: 400,
            }
        );
    }

    const id = body.id || crypto.randomUUID();

    const collection = {
        name: body.name,
        cards: body.cards,
        author: user.username,
    };

    await Bun.write(
        `./data/collections/${id}.json`,
        JSON.stringify(collection)
    );

    if (!body.id) {
        await Bun.write(
            `./data/users/${user.username}.json`,
            JSON.stringify({
                ...user,
                collections: [...user.collections, id],
            })
        );
    }

    return new Response(JSON.stringify({ data: { ...collection, id } }), {
        status: 201,
    });
}
