import { Component, OnInit, Input } from '@angular/core';
import {map} from 'rxjs/operators';
import {Location} from '@angular/common';
import { Area, ECOE, Round, Schedule, Shift, Stage, Station, Student } from '@models/index';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ChronoService } from '@services/chrono/chrono.service';
import { Item, Pagination } from '@openecoe/potion-client';


interface Class<T> {
  new(...args: any[]): T;
}

@Component({
  selector: 'app-ecoe-info',
  templateUrl: './ecoe-info.component.html',
  styleUrls: ['./ecoe-info.component.less']
})
export class EcoeInfoComponent implements OnInit {

  ecoeId: number;
  ecoeName: String ;
  ecoe: ECOE;

  areasTotal: number;
  stationsTotal: number;
  studentsTotal: number;
  roundsTotal: number;
  shiftsTotal: number;
  stagesTotal: number;
  show_areas: Boolean = true;

  // Eliminar ECOE
  eliminando: Boolean = false;
  //--

  // Form ECOE name
  show_ecoe_name_drawer: Boolean = false;
  ecoe_name_form_loading: Boolean = false;
  ecoe_name_form: FormGroup;
  // --

  // Manage ECOE states
  changing_state: Boolean = false;
  // --


  constructor(
    private location: Location,
    private router: Router,
    private translate: TranslateService,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private chronoService: ChronoService,
    private modalSrv: NzModalService) { }

  ngOnInit() {
    this.ecoe_name_form = this.fb.group({
      ecoe_name_2edit: ['', [Validators.required]]
    });

    this.route.params.subscribe(params => {
      this.ecoeId = params.ecoeId;
    });

    if (!this.ecoeId){
      console.log('Error EcoeInfoComponent: params required');
      this.location.back();
    }

    ECOE.fetch<ECOE>(this.ecoeId, {cache: false}).then(value => {
      this.ecoe = value;
      this.ecoeName = this.ecoe.name;

      this.ecoe_name_form.get('ecoe_name_2edit').setValue(this.ecoe.name);

      this.getTotalItems(Area).then(cont => {
        this.areasTotal = cont;
      });

      this.getTotalItems(Station).then(cont => {
        this.stationsTotal = cont;
      });

      this.getTotalItems(Student)
        .then(cont => {
          this.studentsTotal = cont;
        });

      this.getTotalItems(Round).then(cont => {
        this.roundsTotal = cont;
      });

      this.getTotalItems(Shift).then(cont => {
        this.shiftsTotal = cont;
      });

      this.getTotalItems(Schedule).then(cont => {
        this.stagesTotal = cont;
      });

    });
  }

    /**
   * Calls ApiService to delete the actual ECOE.
   * Then navigates to /home page.
   */
  deleteEcoe() {
    this.eliminando = true;

    new ECOE(this.ecoe).destroy().then(
      result => {
        this.router.navigate(['/']);
      }
    ).catch(
      error => {
        this.message.error(this.translate.instant('ERROR_REQUEST_CONTENT'), { nzDuration: 5000 });
      }
    ).finally(
      () => {
        this.eliminando = false;
      }
    )
  }

    /**
   * Show/Hide form to edit ECOE name
   *
   * @param show If true show drawer, if false hide drawer
   */
  showECOENameDrawer(show: Boolean) {
    this.ecoe_name_form.get('ecoe_name_2edit').setValue(this.ecoe.name);
    this.show_ecoe_name_drawer = show;
  }

  /**
   * Submit edit ECOE name form
   */
  submitECOENameForm() {
    this.ecoe_name_form_loading = true;

    new ECOE(this.ecoe).update({name: this.ecoe_name_form.get('ecoe_name_2edit').value}).then(
      response => {
        this.message.success(this.translate.instant('OK_REQUEST_CONTENT'), { nzDuration: 5000 });
        this.ecoe = response;
        this.ecoeName = this.ecoe.name;
      }
    ).catch(
      error => {
        this.message.error(this.translate.instant('ERROR_REQUEST_CONTENT'), { nzDuration: 5000 });
        this.ecoe_name_form.get('ecoe_name_2edit').setValue(this.ecoe.name);
      }
    ).finally(
      () => {
        this.ecoe_name_form_loading = false;
        this.showECOENameDrawer(false);
      }
    );
  }

  onBack() {
    this.router.navigate(['/ecoe']).finally();
  }

  publishECOE() {
    this.changing_state = true;
    this.chronoService.publishECOE(this.ecoeId).toPromise()
      .then(result => this.reloadECOE())
      .catch(err => {
        console.warn(err);
        this.modalSrv.error({
          nzMask: false,
          nzTitle: this.translate.instant('ERROR_ACTION_STATE_PUBLISH')
        });
      })
      .finally(() => {
        this.changing_state = false;
      });
  }

  draftECOE() {
    this.changing_state = true;
    this.chronoService.draftECOE(this.ecoeId).toPromise()
    .then(result => this.reloadECOE())
    .catch(err => {
      console.warn(err);
      this.modalSrv.error({
        nzMask: false,
        nzTitle: this.translate.instant('ERROR_ACTION_STATE_DRAFT')
      });
    })
    .finally(()=>{
      this.changing_state = false;
    })
  }

  reloadECOE(){
    ECOE.fetch<ECOE>(this.ecoeId, {cache: false}).then(value => {
      this.ecoe = value;
    });
  }

  get show_students(): boolean {
    return this.stagesTotal > 0 || this.studentsTotal > 0;
  }

  get show_stations(): boolean {
    return this.areasTotal > 0 || this.stationsTotal > 0;
  }

  get show_schedules(): boolean {
    return this.stationsTotal > 0 || this.stagesTotal > 0;
  }

  get show_planner(): boolean {
    return this.stagesTotal > 0 || this.roundsTotal > 0 || this.shiftsTotal > 0;
  };
  
  async getTotalItems<T extends Item>(itemClass: new () => T): Promise<number> {
    const _pag: Pagination<Item> = await (itemClass as unknown as Item).query({
      where: {ecoe: this.ecoe},
      page: 1,
      perPage: 1
    }, {paginate: true});

    return _pag.total;
  }

}
