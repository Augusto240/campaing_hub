import { Routes } from '@angular/router';

export const CAMPAIGN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./campaign-list/campaign-list.component').then(m => m.CampaignListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./campaign-detail/campaign-detail.component').then(m => m.CampaignDetailComponent)
  }
];
