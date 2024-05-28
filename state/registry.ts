import { atomWithStorage } from 'jotai/utils';

interface RegistryEntry {
  [key: string]: any;
}

export const registryAtom = atomWithStorage<RegistryEntry>('registry', {});
