import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    pathMatch: 'full'
  },
  {
    path: 'wiki',
    loadComponent: () => import('./features/wiki/wiki.component').then(m => m.WikiComponent)
  },
  {
    path: 'dice',
    loadComponent: () => import('./features/dice/dice.component').then(m => m.DiceComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'campaigns',
    canActivate: [authGuard],
    loadChildren: () => import('./features/campaign/campaign.routes').then(m => m.CAMPAIGN_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
