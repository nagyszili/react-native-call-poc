import uuid from "uuid";

export const getNewUuid = () => uuid.v4().toLowerCase();

export const format = (uuid) => uuid.split("-")[0];

export const getRandomNumber = () => String(Math.floor(Math.random() * 100000));
