import { open } from "lmdb";

type lmdb = ReturnType<typeof open>

/**
 * For databases where there are different types stored under different keys in the same DB, this function
 * allows iteration over the values of that relation. Otherwise, you might return the wrong type.
 * It can't be used in DBs that do not have a fixed first key for each type stored.
 * @param db opened lmdb database
 * @param relation the key that uniquely identifies the type of the object
 */
export async function* values<Serialisable>(
    db: lmdb,
    relation: string | undefined
): AsyncGenerator<{ key: string, value: Serialisable }> {
    const keys = db.getKeys().asArray;
    let index = 0;
    for await (const value of await db.getMany(keys)) {
        const key = keys[index];
        if (relation !== undefined) {
            if (relation === key[0]) {
                yield {key: key[1] as string, value: value as Serialisable};
            }
        }
        else {
            yield {key: key as string, value: value as Serialisable};
        }
        index++;
    }
}

export type Meta<T> = {
    expiry: number,
    value: T
}
