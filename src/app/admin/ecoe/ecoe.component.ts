import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ecoe',
  templateUrl: './ecoe.component.html',
  styleUrls: ['./ecoe.component.less']
})
export class EcoeComponent implements OnInit {

  isCollapsed: boolean = false;

  items_menu: Array<{title: string, path: string, icon: string}> = [
    {
      title: 'INFORMATION',
      path: './',
      icon: ''
    },
    {
      title: 'AREAS',
      path: './areas',
      icon: ''
    },
    {
      title: 'QUESTIONS',
      path: './questions',
      icon: ''
    },
    {
      title: 'STATIONS',
      path: './stations',
      icon: ''
    },
    {
      title: 'QBLOCKS',
      path: './qblocks',
      icon: ''
    },
    {
      title: 'CHRONOMETERS',
      path: '',
      icon: ''
    },
    {
      title: 'STUDENTS',
      path: '',
      icon: ''
    },
    {
      title: 'GROUPS',
      path: '',
      icon: ''
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
