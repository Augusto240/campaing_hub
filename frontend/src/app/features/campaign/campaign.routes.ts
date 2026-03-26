import { Routes } from '@angular/router';

export const CAMPAIGN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./campaign-list/campaign-list.component').then(m => m.CampaignListComponent)
  },
  {
    path: ':id/wiki',
    loadComponent: () => import('./campaign-wiki/campaign-wiki.component').then(m => m.CampaignWikiComponent)
  },
  {
    path: ':id/tools',
    loadComponent: () => import('./campaign-tools/campaign-tools.component').then(m => m.CampaignToolsComponent)
  },
  {
    path: ':id/combat',
    loadComponent: () => import('./campaign-combat/campaign-combat.component').then(m => m.CampaignCombatComponent)
  },
  {
    path: ':id/compendium',
    loadComponent: () => import('./campaign-compendium/campaign-compendium.component').then(m => m.CampaignCompendiumComponent)
  },
  {
    path: ':id/schedule',
    loadComponent: () => import('./campaign-schedule/campaign-schedule.component').then(m => m.CampaignScheduleComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./campaign-detail/campaign-detail.component').then(m => m.CampaignDetailComponent)
  }
];
