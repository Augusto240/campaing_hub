import { Injectable } from '@angular/core';
import { WorkshopSeed } from '../workshop.types';

const cloneSeed = (seed: WorkshopSeed): WorkshopSeed => JSON.parse(JSON.stringify(seed)) as WorkshopSeed;

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private seedPromise: Promise<WorkshopSeed> | null = null;

  async loadSeed(): Promise<WorkshopSeed> {
    this.seedPromise ??= fetch('/assets/workshop/seed.json', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Workshop seed failed with ${response.status}`);
      }

      return (await response.json()) as WorkshopSeed;
    });

    return cloneSeed(await this.seedPromise);
  }
}
