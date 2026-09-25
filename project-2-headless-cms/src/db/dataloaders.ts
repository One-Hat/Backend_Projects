import DataLoader from 'dataloader';
import { prisma } from './prisma.js';
import { Entry, Asset } from '@prisma/client';

export interface CMSDataLoaders {
  entryById: DataLoader<string, Entry | null>;
  assetById: DataLoader<string, Asset | null>;
  relationsBySourceEntryId: DataLoader<string, { fieldSlug: string; targetEntry: Entry }[]>;
  assetsByEntryId: DataLoader<string, { fieldSlug: string; asset: Asset }[]>;
}

export function createDataLoaders(): CMSDataLoaders {
  // Batch load entries by Entry ID
  const entryById = new DataLoader<string, Entry | null>(async (ids) => {
    const entries = await prisma.entry.findMany({
      where: { id: { in: [...ids] } },
      include: { contentType: true },
    });
    const entryMap = new Map(entries.map((e) => [e.id, e]));
    return ids.map((id) => entryMap.get(id) || null);
  });

  // Batch load assets by Asset ID
  const assetById = new DataLoader<string, Asset | null>(async (ids) => {
    const assets = await prisma.asset.findMany({
      where: { id: { in: [...ids] } },
    });
    const assetMap = new Map(assets.map((a) => [a.id, a]));
    return ids.map((id) => assetMap.get(id) || null);
  });

  // Batch load relations for source entries
  const relationsBySourceEntryId = new DataLoader<string, { fieldSlug: string; targetEntry: Entry }[]>(
    async (sourceEntryIds) => {
      const relations = await prisma.entryRelation.findMany({
        where: { sourceEntryId: { in: [...sourceEntryIds] } },
        include: { targetEntry: { include: { contentType: true } } },
      });

      const relationMap = new Map<string, { fieldSlug: string; targetEntry: Entry }[]>();
      for (const id of sourceEntryIds) {
        relationMap.set(id, []);
      }

      for (const r of relations) {
        relationMap.get(r.sourceEntryId)?.push({
          fieldSlug: r.fieldSlug,
          targetEntry: r.targetEntry,
        });
      }

      return sourceEntryIds.map((id) => relationMap.get(id) || []);
    }
  );

  // Batch load assets linked to entries
  const assetsByEntryId = new DataLoader<string, { fieldSlug: string; asset: Asset }[]>(
    async (entryIds) => {
      const entryAssets = await prisma.entryAsset.findMany({
        where: { entryId: { in: [...entryIds] } },
        include: { asset: true },
      });

      const assetMap = new Map<string, { fieldSlug: string; asset: Asset }[]>();
      for (const id of entryIds) {
        assetMap.set(id, []);
      }

      for (const ea of entryAssets) {
        assetMap.get(ea.entryId)?.push({
          fieldSlug: ea.fieldSlug,
          asset: ea.asset,
        });
      }

      return entryIds.map((id) => assetMap.get(id) || []);
    }
  );

  return {
    entryById,
    assetById,
    relationsBySourceEntryId,
    assetsByEntryId,
  };
}
