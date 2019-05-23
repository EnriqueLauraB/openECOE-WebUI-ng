import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {ApiService} from '../../../../services/api/api.service';
import {forkJoin, Observable} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {SharedService} from '../../../../services/shared/shared.service';

/**
 * Component with questions and options by question.
 */
@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.less']
})
export class QuestionsComponent implements OnInit {

  stations: any[] = [];
  stationSelected: any;
  areas: any[] = [];
  qblocks: any[] = [];
  editCache = {};
  editCacheOption = {};
  ecoeId: number;
  qblockId: number;
  stationId: number;
  questionShowQblocks = {};
  valueopt: number;

  index: number = 1;
  indexOpt: number = 1;

  question_type_options: Array<{ type: string, label: string }> = [
    {type: 'RB', label: 'ONE_ANSWER'},
    {type: 'CH', label: 'MULTI_ANSWER'},
    {type: 'RS', label: 'VALUE_RANGE'}
  ];

  constructor(private apiService: ApiService,
              private route: ActivatedRoute,
              private router: Router,
              private sharedService: SharedService) {
  }

  /**
   * Listens for URL changes to filter the questions by station and Qblock.
   */
  ngOnInit() {
    this.ecoeId = +this.route.snapshot.params.id;

    this.route.queryParamMap.subscribe((params: ParamMap) => {
      this.qblockId = params.get('qblock') ? +params.get('qblock') : null;
      this.stationId = params.get('station') ? +params.get('station') : null;
      this.loadQuestions();
    });
  }

  /**
   * Load questions by the passed Station and ECOE.
   * Loads all the stations, then filters by the station passed on the URL and loads their qblocks.
   * Finally, loads the questions for each Qblock and creates the multi-level array.
   */
  loadQuestions() {
    // TODO: Only fetch 10 questions per station, need to create pagination for questions

    this.stationSelected = {};
    this.apiService.getResources('area', {
      where: `{"ecoe":${this.ecoeId}}`
    }).pipe(
      mergeMap(areas => {
        this.areas = areas;
        return this.apiService.getResources('station', {
          where: `{"ecoe":${this.ecoeId}}`
        }).pipe(
          mergeMap(stations => {
            this.stations = stations;
            const station = this.stationId ? stations.find(st => st.id === this.stationId) : stations[0];
            return this.apiService.getResources('qblock', {
              where: (this.stationId && this.qblockId) ? `{"$uri":"/api/qblock/${this.qblockId}"}` : `{"station":${station.id}}`
            }).pipe(
              mergeMap(qblocks => {
                this.stationId = station.id;
                return <Observable<any[]>>forkJoin(...qblocks.map(qblock => {
                  return this.apiService.getResources('question', {
                    where: `{"qblocks":{"$contains":${qblock.id}}}`
                  }).pipe(map(questions => {
                    questions = questions.map(q => {
                      const area = areas.find(a => a['$uri'] === q.area['$ref']);
                      return {...q, areaName: area.name, areaId: area.id};
                    });

                    qblock.show = true;
                    return [{...qblock, questions}];
                  }));
                }));
              }),
              map(qblocks => {
                return [{...station, qblocks: [].concat.apply([], qblocks)}];
              })
            );
          })
        );
      })
    ).subscribe(response => {
      this.stationSelected = response[0];
      this.updateEditCache();
    });
  }

  /**
   * Adds to the resource passed its array of options as a new key object.
   * Then updates the options cache.
   *
   * @param {boolean} expand State of the expanded sub-table
   * @param {any} question Resource selected to show its options
   */
  loadOptionsByQuestion(expand: boolean, question: any) {
    if (expand) {
      this.apiService.getResources('option', {
        where: `{"question":${question.id}}`,
        sort: '{"order":false}'
      }).subscribe(options => {
        question.optionsArray = options;

        question.optionsArray.forEach(option => {
          this.editCacheOption[option.id] = {
            edit: this.editCacheOption[option.id] ? this.editCacheOption[option.id].edit : false,
            ...option
          };
        });
      });
    }
  }

  /**
   * Load qblocks by the passed station.
   *
   * @param {number} stationId Id of the parent resource
   */
  loadQblocksByStation(stationId: number) {
    this.apiService.getResources('qblock', {
      where: `{"station":${stationId}}`
    }).subscribe(qblocks => this.qblocks = qblocks);
  }

  /**
   * Sets the editCache variable to true.
   * Changes text-view tags by input tags.
   *
   * @param {number} id Id of the selected resource
   */
  startEdit(id: number) {
    this.editCache[id].edit = true;
  }

  /**
   * Creates or updates the resource passed.
   * Then updates the variables to avoid calling the backend again.
   *
   * @param {any} question Resource selected
   * @param {any} qblock Parent resource passed
   * @param {boolean} newItem determines if the resource is already saved
   */
  saveItem(question: any, qblock: any, newItem: boolean) {
    const item = this.editCache[question.id];

    if (!item.description || !item.reference || !item.question_type || !item.areaId || !qblock.id) {
      return;
    }

    const body = {
      order: +item.order,
      description: item.description,
      reference: item.reference,
      question_type: item.question_type,
      area: item.areaId,
      qblocks: [qblock.id]
    };

    const request = (
      newItem ?
        this.apiService.createResource('question', body) :
        this.apiService.updateResource(item['$uri'], body)
    );

    request.pipe(
      map(response => {
        const area = this.areas.find(a => a.id === item.areaId);
        return {
          areaId: area.id,
          areaName: area.name,
          optionsArray: question.optionsArray,
          ...response
        };
      })
    ).subscribe(response => {
      delete this.editCache[question.id];
      delete this.editCache[response['id']];
      delete this.questionShowQblocks[question.id];
      delete this.questionShowQblocks[response['id']];

      this.editCache[response['id']] = {
        edit: false,
        areaId: question.areaId,
        ...response
      };

      this.questionShowQblocks[response['id']] = {
        show: false
      };

      qblock.questions = qblock.questions.map(x => (x.id === question.id) ? response : x);
    });
  }

  /**
   * Sets the editCache variable to false.
   * If resource is not already saved, calls [updateArrayQuestions]{@link #updateArrayQuestions} function.
   * Else resets editCache to the previous value.
   *
   * @param {any} question Resource selected
   * @param {any} qblock Parent resource passed
   */
  cancelEdit(question: any, qblock: any) {
    this.editCache[question.id].edit = false;

    if (this.editCache[question.id].new_item) {
      this.updateArrayQuestions(question.id, qblock);
    } else {
      this.editCache[question.id] = question;
    }
  }

  /**
   * Calls ApiService to delete the resource passed.
   * Then calls [updateArrayQuestions]{@link #updateArrayQuestions} function.
   *
   * @param {any} question Resource selected
   * @param {any} qblock Parent resource passed
   */
  deleteItem(question: any, qblock: any) {
    this.apiService.deleteResource(question['$uri']).subscribe(() => {
      this.updateArrayQuestions(question.id, qblock);
    });
  }

  /**
   * Adds a new empty field to the resources array.
   * Then updates editCache with the new resource.
   */
  addQuestion(qblock) {
    this.apiService.getResources('question')
      .subscribe(questions => {
        this.index += this.sharedService.getLastIndex(questions);

        const newItem = {
          id: this.index,
          order: '',
          description: '',
          reference: '',
          question_type: '',
          area: '',
          qblocks: [],
          options: []
        };

        qblock.questions = [...qblock.questions, newItem];

        this.editCache[this.index] = {
          edit: true,
          new_item: true,
          ...newItem
        };
      });
  }

  /**
   * Updates editCache variable with the same values of the resources array and adds a 'edit' key.
   */
  updateEditCache(): void {
    this.editCache = {};
    this.stationSelected.qblocks.forEach(qb => {
      qb.questions.forEach(item => {
        this.questionShowQblocks[item.id] = {
          show: false
        };
        this.editCache[item.id] = {
          edit: this.editCache[item.id] ? this.editCache[item.id].edit : false,
          ...item
        };
      });
    });
  }

  /**
   * Deletes the editCache key assigned to the resource id passed and filters out the item from the resources array.
   *
   * @param {number} questionId Id of the resource passed
   * @param {any} qblock Parent resource passed
   */
  updateArrayQuestions(questionId: number, qblock: any) {
    delete this.editCache[questionId];
    delete this.questionShowQblocks[questionId];
    qblock.questions = qblock.questions.filter(x => x.id !== questionId);
  }

  /**
   * Moves the passed question to the selected Qblock.
   * Then reloads the questions array.
   *
   * @param {number} questionId Id of the resource passed
   * @param {number} qblockPrevId Id of the actual Qblock
   * @param {number} qblockNextId Id of the Qblock to move in
   */
  moveQuestion(questionId: number, qblockPrevId: number, qblockNextId: number) {
    forkJoin(
      this.apiService.deleteResource(`/api/qblock/${qblockPrevId}/questions`, questionId),
      this.apiService.createResource(`qblock/${qblockNextId}/questions`, questionId)
    ).subscribe(() => {
      this.questionShowQblocks[questionId].show = false;
      this.loadQuestions();
    });
  }

  getQuestionTypeLabel(questionType: string) {
    return this.question_type_options.find(x => x.type === questionType).label;
  }

  /**
   * Sets the editCacheOption variable to true.
   * Changes text-view tags by input tags.
   *
   * @param {number} id Id of the selected resource
   */
  startEditOption(id: number) {
    this.editCacheOption[id].edit = true;
  }

  /**
   * Creates or updates the resource passed.
   * Then updates the variables to avoid calling the backend again and sorts the array.
   *
   * @param {any} option Resource selected
   * @param {any} question Parent resource passed
   * @param {boolean} newItem determines if the resource is already saved
   */
  saveOption(option: any, question: any, newItem: boolean) {
    const item = this.editCacheOption[option.id];

    if (!item.order || !item.label || !item.points) {
      return;
    }

    const body = {
      order: +item.order,
      label: item.label,
      points: +item.points,
      question: question.id
    };

    const request = (
      newItem ?
        this.apiService.createResource('option', body) :
        this.apiService.updateResource(item['$uri'], body)
    );

    request.subscribe(response => {
      delete this.editCacheOption[option.id];
      delete this.editCacheOption[response['id']];

      this.editCacheOption[response['id']] = {
        edit: false,
        ...response
      };

      question.optionsArray = question.optionsArray
        .map(x => (x.id === option.id ? response : x))
        .sort(this.sharedService.sortArray);
    });
  }

  /**
   * Sets the editCacheOption variable to false.
   * If resource is not already saved, calls [updateArrayOptions]{@link #updateArrayOptions} function.
   * Else resets editCache to the previous value.
   *
   * @param {any} option Resource selected
   * @param {any} question Parent resource passed
   */
  cancelEditOption(option: any, question: any) {
    this.editCacheOption[option.id].edit = false;

    if (this.editCacheOption[option.id].new_item) {
      this.updateArrayOptions(option.id, question);
    } else {
      this.editCacheOption[option.id] = option;
    }
  }

  /**
   * Calls ApiService to delete the resource passed.
   * Then calls [updateArrayOptions]{@link #updateArrayOptions} function.
   *
   * @param {any} option Resource selected
   * @param {any} question Parent resource passed
   */
  deleteOption(option: any, question: any) {
    this.apiService.deleteResource(option['$uri']).subscribe(() => {
      this.updateArrayOptions(option.id, question);
    });
  }

  /**
   * Deletes the editCacheOption key assigned to the resource id passed, filters out the item from the resources array and sorts the array.
   *
   * @param {number} option Id of the resource passed
   * @param {any} question Parent resource passed
   */
  updateArrayOptions(option: number, question: any) {
    delete this.editCacheOption[option];
    question.optionsArray = question.optionsArray
      .filter(x => x.id !== option)
      .sort(this.sharedService.sortArray);
  }

  /**
   * Adds a new empty field to the resources array.
   * Then updates editCacheOption with the new resource.
   *
   * @param {any} question Parent resource passed
   */
  addOption(question: any) {
    this.apiService.getResources('option')
      .subscribe(options => {
        this.indexOpt += this.sharedService.getLastIndex(options);

        const newItem = {
          id: this.indexOpt,
          order: '',
          label: '',
          points: 0,
          question: question.id
        };

        question.optionsArray = [...question.optionsArray, newItem];

        this.editCacheOption[this.indexOpt] = {
          edit: true,
          new_item: true,
          ...newItem
        };
      });
  }

  /**
   * Moves the option one position above or down.
   * Updates the order key of the resource passed and the next to it.
   * Then updates the variables to avoid calling the backend again and sorts the array.
   *
   * @param {string} direction 'up' or 'down'
   * @param {any} option Resource passed
   * @param {number} index Current index of the selected resource
   * @param {any} question Parent resource passed
   */
  changeOptionOrder(direction: string, option: any, index: number, question: any) {
    const itemToMove = (direction === 'up') ? question.optionsArray[index - 1] : question.optionsArray[index + 1];

    forkJoin(
      this.apiService.updateResource(option['$uri'], {order: itemToMove.order}),
      this.apiService.updateResource(itemToMove['$uri'], {order: option.order})
    ).subscribe(response => {
      response.forEach(res => {
        this.editCacheOption[res['id']] = res;

        question.optionsArray = question.optionsArray
          .map(x => (x.id === res.id ? res : x))
          .sort(this.sharedService.sortArray);
      });
    });
  }

  /**
   * Removes the Qblock filter and reloads the page by updating the URL.
   *
   * @param {number} station Id of the station passed
   */
  deleteFilter(station: number) {
    this.router.navigate(['../questions'], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {station: station}
    });
  }
}
