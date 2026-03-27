import { MMKV } from 'react-native-mmkv'
import { type StateStorage } from 'zustand/middleware'

import { logger } from '@/utils/logger'

const storage = new MMKV()

export type StorageOuput = {
  value: any
  error: string
  status: boolean
}

const generateOuput = (value: any, error: string, status: boolean) => {
  const output: StorageOuput = {
    value,
    error,
    status,
  }
  return output
}

const set = (key: string, value: any) => {
  if (!key || typeof key !== 'string') {
    return generateOuput(null, 'Key is invalid!', false)
  }
  try {
    const jsonStringValue = JSON.stringify(value)
    storage.set(`MMKV-${key}`, jsonStringValue)
    return generateOuput(null, '', true)
  } catch (error) {
    return generateOuput(null, `Saving error: ${JSON.stringify(error)}`, false)
  }
}

const get = (key: string) => {
  if (!key || typeof key !== 'string' || !storage.contains(`MMKV-${key}`)) {
    logger.warn('MMKVStorage', 'Key is invalid', key)
    return null
  }
  try {
    const jsonValue = storage.getString(`MMKV-${key}`)
    const value = JSON.parse(jsonValue ?? '')
    return value
  } catch (error) {
    logger.error('MMKVStorage', 'Reading error', error)
    return null
  }
}

const remove = (key: string) => {
  if (storage.contains(`MMKV-${key}`)) {
    storage.delete(`MMKV-${key}`)
  }
}

export const MMKVStorage = {
  set,
  get,
  remove,
}

export const MMKVStateStorage: StateStorage = {
  getItem: (name: string) => {
    return storage.getString(`MMKV-${name}`) ?? null
  },
  setItem: (name: string, value: string) => {
    storage.set(`MMKV-${name}`, value)
  },
  removeItem: (name: string) => {
    storage.delete(`MMKV-${name}`)
  },
}
