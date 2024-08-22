import { MMKV } from 'react-native-mmkv'

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
    console.log('Key is invalid!', key)
    return null
  }
  try {
    const jsonValue = storage.getString(`MMKV-${key}`)
    const value = JSON.parse(jsonValue ?? '')
    return value
  } catch (error) {
    console.log(`Reading error: ${JSON.stringify(error)}`)
    return null
  }
}

const remove = (key: string) => {
  if (storage.contains(key)) {
    storage.delete(`MMKV-${key}`)
  }
}

export const MMKVStorage = {
  set,
  get,
  remove,
}
