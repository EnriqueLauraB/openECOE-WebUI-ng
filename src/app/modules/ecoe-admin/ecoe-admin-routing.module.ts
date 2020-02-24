import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AreasComponent } from './areas/areas.component';
import { StationsComponent } from './stations/stations.component';
import {EcoeInfoComponent} from '../ecoe/ecoe-info/ecoe-info.component';
import { QuestionsListComponent } from 'src/app/components/questions-list/questions-list.component';
import { StationDetailsComponent } from './station-details/station-details.component';

const routes: Routes = [
  { 
    path: '',
    children: [
      { path: '', component: EcoeInfoComponent },
      { path: 'areas', component: AreasComponent },
      { path: 'stations', component: StationsComponent },
      { path: 'stations/:stationId', component: StationDetailsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EcoeAdminRoutingModule { }
