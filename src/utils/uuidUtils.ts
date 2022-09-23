import {v4 as uuidv4} from 'uuid';

export const uuid = () => uuidv4();

export const uuid8 = () => uuidv4().replace(/-/g, '').slice(0, 8);

export const uuid16 = () => uuidv4().replace(/-/g, '').slice(0, 16);