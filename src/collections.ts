import { readdirSync } from "node:fs";
import { getUserAuthentication } from "./authorization";
import type { Collection } from "./types";

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

    if (!data.public && data.author !== user.username) {
        return new Response(
            JSON.stringify({
                error: { message: "Forbidden." },
            }),
            {
                status: 403,
            }
        );
    }

    return new Response(JSON.stringify({ data }));
}

export async function getManyCollectionsRoute(request: Request) {
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

    if (!body.ids || !Array.isArray(body.ids)) {
        return new Response(
            JSON.stringify({
                error: { message: "Collection IDs are required." },
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

    const data: Map<String, Collection> = new Map();
    const errors: string[] = [];

    for (const id of body.ids) {
        const collection = collections.find((e) => e === `${id}.json`);

        if (!collection) {
            errors.push(`${id} not found.`);
            continue;
        }

        const collectionData: Collection = await Bun.file(
            `./data/collections/${id}.json`
        ).json();

        if (!collectionData.public && collectionData.author !== user.username) {
            errors.push(`${id} forbidden.`);
            continue;
        }

        data.set(id, collectionData);
    }

    return new Response(
        JSON.stringify({ data: Object.fromEntries(data.entries()), errors })
    );
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

    let collection: Collection;

    const id = body.id || crypto.randomUUID();

    if (await Bun.file(`./data/collections/${id}.json`).exists()) {
        const currentCollection = await Bun.file(
            `./data/collections/${id}.json`
        ).json();

        if (currentCollection.author !== user.username) {
            return new Response(
                JSON.stringify({
                    error: { message: "Forbidden." },
                }),
                {
                    status: 403,
                }
            );
        }

        collection = {
            name: body.name || currentCollection.name || "",
            cards: body.cards || currentCollection.cards || [],
            author: user.username,
            version: body.version || currentCollection.version || 1,
            description:
                body.description || currentCollection.description || "",
            public: body.public || currentCollection.public || false,
            sets: body.sets || currentCollection.sets || [],
        };
    } else {
        if (
            !body.name ||
            !body.cards ||
            !Array.isArray(body.cards) ||
            !(body.cards as String[][]).every((e: String[]) => Array.isArray(e))
        ) {
            return new Response(
                JSON.stringify({
                    error: {
                        message: "Collection name and cards are required.",
                    },
                }),
                {
                    status: 400,
                }
            );
        }

        collection = {
            name: body.name,
            cards: body.cards,
            author: user.username,
            version: body.version || 1,
            description: body.description || "",
            public: body.public || false,
            sets: body.sets || [],
        };
    }

    return new Response(JSON.stringify({ data: { ...collection, id } }), {
        status: 201,
    });
}
