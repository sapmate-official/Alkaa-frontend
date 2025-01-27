import {atom} from 'jotai'
import { User } from '../interface/general'
export const userIdAtom = atom<number | null>(null)