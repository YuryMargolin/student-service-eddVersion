let collection;

export const init = db => collection = db.collection('college');

export const addStudent = async ({id, name, password}) => {
    const existingStudent = await collection.findOne({_id: id});
    if (existingStudent) {
        return false;
    }
    await collection.insertOne({_id: id, name, password, scores: {}});
    return true;
}

export const findStudent = async id => {
    return await collection.findOne({_id: id});
}

export const deleteStudent = async id => {
    return await collection.findOneAndDelete({_id: id});
}

export const updateStudent = async (id, data) => {
    return await collection.findOneAndUpdate(
        {_id: id},
        {$set: data},
        {returnDocument: 'after'}
    );
}

export const addScore = async (id, exam, score) => {
    return await collection.findOneAndUpdate(
        {_id: id},
        {$set: {[`scores.${exam}`]: score}},
    )
}

export const findByName = async (name) => {
    return await collection.find(
        {name: { $regex: `^${name}$`, $options: "i" }}
    ).toArray();
}

export const countByNames = async (names) => {
    const uniqueNames = new Set(names.map(name => name.toLowerCase()));
    let count = 0;
    for (const name of uniqueNames) {
        count += (await collection.countDocuments({name: {$regex: `^${name}$`, $options: "i"}}))
    }
    return count;
}

export const findByMinScore = async (exam, minScore) => {
    return await collection.find(
        {[`scores.${exam}`]: {$gte: minScore}}
    ).toArray();
}