import { getUserAuthentication } from "./authorization";
import { readdirSync } from "node:fs";
import type { Collection, LearningSet } from "./types";

export async function getLearningSetRoute(request: Request) {
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
                error: { message: "Learning set ID is required." },
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

    if (!(await Bun.file(`./data/sets/${body.id}.json`).exists())) {
        return new Response(
            JSON.stringify({
                error: { message: "Not found." },
            }),
            {
                status: 404,
            }
        );
    }

    const learningSet = await Bun.file(`./data/sets/${body.id}.json`).json();

    if (!learningSet.public && learningSet.author !== user.username) {
        return new Response(
            JSON.stringify({
                error: { message: "Forbidden." },
            }),
            {
                status: 403,
            }
        );
    }

    return new Response(JSON.stringify({ data: learningSet }));
}

export async function getManyLearningSetsRoute(request: Request) {
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

    if (!body.ids || !Array.isArray(body.ids)) {
        return new Response(
            JSON.stringify({
                error: { message: "Learning set IDs are required." },
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

    const learningSets = readdirSync(`./data/sets`);

    const data: Map<String, LearningSet> = new Map();
    const errors: string[] = [];

    for (const id of body.ids) {
        const set = learningSets.find((set) => set === `${id}.json`);

        if (!set) {
            errors.push(`${id} not found.`);
            continue;
        }

        const learningSet = await Bun.file(`./data/sets/${set}`).json();

        if (!learningSet.public && learningSet.author !== user.username) {
            errors.push(`${id} forbidden.`);
            continue;
        }

        data.set(id, learningSet);
    }

    return new Response(
        JSON.stringify({ data: Object.fromEntries(data.entries()), errors })
    );
}

export async function updateLearningSetRoute(request: Request) {
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

    let set: LearningSet;

    const id = body.id || crypto.randomUUID();

    if (await Bun.file(`./data/sets/${id}.json`).exists()) {
        const currentSet = await Bun.file(`./data/sets/${id}.json`).json();

        if (currentSet.author !== user.username) {
            return new Response(
                JSON.stringify({
                    error: { message: "Forbidden." },
                }),
                {
                    status: 403,
                }
            );
        }

        set = {
            name: body.name || currentSet.name || "",
            collections: body.collections || currentSet.cards || [],
            author: user.username,
            version: body.version || currentSet.version || 1,
            description: body.description || currentSet.description || "",
            public: body.public || currentSet.public || false,
        };
    } else {
        if (
            !body.name ||
            !body.collections ||
            !Array.isArray(body.collections)
        ) {
            return new Response(
                JSON.stringify({
                    error: {
                        message:
                            "Learning set name and collections are required.",
                    },
                }),
                {
                    status: 400,
                }
            );
        }

        set = {
            name: body.name,
            collections: body.collections,
            author: user.username,
            version: body.version || 1,
            description: body.description || "",
            public: body.public || false,
        };
    }

    await Bun.write(`./data/sets/${id}.json`, JSON.stringify(set));

    if (!body.id) {
        await Bun.write(
            `./data/users/${user.username}.json`,
            JSON.stringify({
                ...user,
                sets: [...user.sets, id],
            })
        );
    }

    return new Response(JSON.stringify({ data: { ...set, id } }), {
        status: 201,
    });
}
