import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NzFormModule } from "ng-zorro-antd";
import { stringify } from "querystring";

@Component({
  selector: "app-generate-reports",
  templateUrl: "./generate-reports.component.html",
  styleUrls: ["./generate-reports.component.less"],
})
export class GenerateReportsComponent implements OnInit {
  dataSet: Dummy[] = [
    {
      area: "Area1",
      data1: "Dato 1",
      data2: "Dato 2",
    },
    {
      area: "Area1",
      data1: "Dato 1",
      data2: "Dato 2",
    },
  ];
  FData: any;
  signature_type: any;
  signature_person: any;
  signer_status: any;
  signature_faculty: any;
  ngOnInit(): void {
    throw new Error("Method not implemented.");
  }

  validateForm!: FormGroup;
  listOfControl: Array<{ id: number; controlInstance: string }> = [];

  addField(e?: MouseEvent): void {
    if (e) {
      e.preventDefault();
    }
    const id =
      this.listOfControl.length > 0
        ? this.listOfControl[this.listOfControl.length - 1].id + 1
        : 0;

    const control = {
      id,
      controlInstance: `signature${id}`,
    };
    const index = this.listOfControl.push(control);
    console.log(this.listOfControl[this.listOfControl.length - 1]);
    this.validateForm.addControl(
      this.listOfControl[index - 1].controlInstance,
      new FormControl(null, Validators.required)
    );
  }

  removeField(i: { id: number; controlInstance: string }, e: MouseEvent): void {
    e.preventDefault();
    if (this.listOfControl.length > 0) {
      const index = this.listOfControl.indexOf(i);
      this.listOfControl.splice(index, 1);
      console.log(this.listOfControl);
      this.validateForm.removeControl(i.controlInstance);
    }
  }

  submitData() {
    FData = {
      ecoe: (<HTMLInputElement>document.getElementById("ECOE_type")).value,
      faculty: (<HTMLInputElement>document.getElementById("faculty")).value,
      university: (<HTMLInputElement>document.getElementById("uni")).value,
      date: (<HTMLInputElement>document.getElementById("ECOE_date")).value,
      explanation_ECOE: (<HTMLInputElement>(
        document.getElementById("ECOE_explanation")
      )).value,
      explanation_results: (<HTMLInputElement>(
        document.getElementById("results_explanation")
      )).value,
      signature_list: this.fillSignList(),
    };
    const FdataList = this.FData;
    //FdataList.push(this.listOfControl);
    console.log(FData);
    console.log(FdataList);
  }

  fillSignList() {
    var signList: Array<listSign>;
    for (let i = 0; i < this.listOfControl.length; i++) {
      var sign_Element = document.getElementById(String(i));
      this.signature_type = document.getElementById("signature_type");
      console.log(this.signature_type);
      /*
      SData = {
        signature_type: sign_Element.querySelector(".signature_type").nodeValue,
        profesor: (<HTMLInputElement>document.getElementById("control.sp"))
          .value,
        job: (<HTMLInputElement>document.getElementById("control.ss")).value,
        sign_faculty: (<HTMLInputElement>document.getElementById("control.sf"))
          .value,
      };
      */
      signList.push(SData);
    }
    return signList;
  }
}
interface Dummy {
  area: string;
  data1: string;
  data2: string;
}
interface listSign {
  signature_type: string;
  profesor: string;
  job: string;
  sign_faculty: string;
}
interface formData {
  ecoe: string;
  faculty: string;
  university: string;
  date: string;
  explanation_ECOE: string;
  explanation_results: string;
  signature_list: Array<listSign>;
}

let FData: formData;
let SData: listSign;
