import { LightningElement, wire, track, api } from 'lwc';
import { createRecord, getRecord, updateRecord  } from 'lightning/uiRecordApi';
import { getPicklistValues , getObjectInfo } from 'lightning/uiObjectInfoApi'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import selectById from '@salesforce/apex/UsersSelector.selectById';
import sendEmailAlert from '@salesforce/apex/newViolationController.sendEmailAlert';
import getLogs from '@salesforce/apex/newViolationController.getLogs';
import VIOLATION_OBJECT from '@salesforce/schema/Violation__c';
import ID_FIELD from '@salesforce/schema/Violation__c.Id';
import NAME_FIELD from '@salesforce/schema/Violation__c.Name';
import MARK_FIELD from '@salesforce/schema/Violation__c.Mark__c';
import STATUS_FIELD from '@salesforce/schema/Violation__c.Status__c';
import PROOF_FIELD from '@salesforce/schema/Violation__c.Proof__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Violation__c.Description__c';
import CREATEDBYID_FIELD from '@salesforce/schema/Violation__c.CreatedById';
import CREATIONDATE_FIELD from '@salesforce/schema/Violation__c.Creation_Date__c';


const FIELDS = [
    MARK_FIELD.objectApiName + '.' + MARK_FIELD.fieldApiName,
    STATUS_FIELD.objectApiName + '.' + STATUS_FIELD.fieldApiName,
    NAME_FIELD.objectApiName + '.' + NAME_FIELD.fieldApiName,
    PROOF_FIELD.objectApiName + '.' + PROOF_FIELD.fieldApiName,
    DESCRIPTION_FIELD.objectApiName + '.' + DESCRIPTION_FIELD.fieldApiName,
    CREATEDBYID_FIELD.objectApiName + '.' + CREATEDBYID_FIELD.fieldApiName,
    CREATIONDATE_FIELD.objectApiName + '.' + CREATIONDATE_FIELD.fieldApiName,
];

export default class NewViolation extends LightningElement {
    @api recordId;
    @api recordTypeId;
    
    @api markFieldLabel = 'Mark';
    @api markCurrent;
    @api markPrevious;
    @track markOptions;
    @api inputBackground = "slds-input slds-combobox__input"

    @api statusFieldLabel = 'Status';
    @track statusOptions;
    @api statusCurrent;
    @api statusPrevious;

    @api descriptionFieldLabel = 'Description';
    @api descriptionCurrent;
    @api descriptionPrevious;


    @api proofFieldLabel = 'Proof';
    @api proofCurrent;
    @api proofPrevious;

    @api nameValue
    @api createdByIdValue
    @api creationDateValue
    @api createdByNameValue

    @api actionType = this.recordId ? 'Create violation' : 'Save'
    @api isChanged;

    @api logData
    logColumns = [
        { label: 'Time', fieldName: 'time', type: 'date', typeAttributes:{
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }},
        { label: 'Perfomed by', fieldName: 'perfomedBy' },
        { label: 'Action', fieldName: 'action' },
        { label: 'Details', fieldName: 'details' },
    ]


    connectedCallback() {
        console.log(this.recordId)
    }
    get isChanged() {
        return !this.recordId ||
        this.statusCurrent !== this.statusPrevious ||
        this.markCurrent !== this.markPrevious ||
        this.descriptionCurrent !== this.descriptionPrevious ||
        this.proofCurrent !== this.proofPrevious
    }
    @api isLoading = false;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ data, error }) {
        if (data) {
            console.log(data)
            this.recordTypeId = data.recordTypeId;
            this.markCurrent = data.fields.Mark__c.value; 
            this.markPrevious = data.fields.Mark__c.value; 
            this.statusCurrent = data.fields.Status__c.value;
            this.statusPrevious = data.fields.Status__c.value;
            this.descriptionCurrent = data.fields.Description__c.value;
            this.descriptionPrevious = data.fields.Description__c.value;
            this.proofCurrent = data.fields.Proof__c.value;
            this.proofPrevious = data.fields.Proof__c.value;
            this.nameValue = data.fields.Name.value;
            this.createdByIdValue = data.fields.CreatedById.value;
            this.creationDateValue = data.fields.Creation_Date__c.displayValue;
        } else if (error) {
            console.log('Error fetching record info:');
            console.log(error)
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: MARK_FIELD.objectApiName + '.' + MARK_FIELD.fieldApiName})
    getMarkOptions({ data, error }) {
        if (data) {
            this.markOptions = data.values.map(i => {
                return {
                    label: i.label,
                    value: i.value,
                    // for optional styling
                    class: `palette ${/\w+/.exec(i.label.toLowerCase())[0]}`
                };
            });
        } else if (error) {
            console.log('Error fetching mark options:');
            console.log(error)
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: STATUS_FIELD.objectApiName + '.' + STATUS_FIELD.fieldApiName})
    getStatusOptions({ data, error }) {
        if (data) {
            this.statusOptions = data.values.map(i => {
                return {
                    label: i.label,
                    value: i.value,
                };
            });

        } else if (error) {
            console.log('Error fetching status options:');
            console.log(error)
        }
    }

    @wire(selectById, { id: '$createdByIdValue' })
    getName({ data, error }) {
        if (data) {
            this.createdByNameValue = data[0].Name
        } else if (error) {
            console.log('Error while fetching user`s Name by id');
            console.log(error)
        }
    }




    get acceptedFormats() {
        return ['.pdf', '.png', '.bmp'];
    }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: `No. of files uploaded : ${uploadedFiles.length}. Refresh the page to access them.`,
                variant: 'success',
            }),
        );
    }





    changeStatus(event) {
        this.statusCurrent = event.detail.value;
    }

    get inputBackground() {
        return this.markCurrent ? 
            `slds-input slds-combobox__input ${/\w+/.exec(this.markCurrent.toLowerCase())[0]}` :
            'slds-input slds-combobox__input'
    }

    changeMark(e) {
        if(!e.target.classList.contains('slds-combobox__input')) {
            this.markCurrent = e.target.getAttribute('title');
        }
        e.currentTarget.classList.toggle('slds-is-open');
    }

    changeDescription(e) {
        this.descriptionCurrent = e.detail.value;
    }

    changeProof(e) {
        this.proofCurrent = e.detail.value;
    }

    upsertViolation() {
        this.isLoading = true;
        if(this.recordId) {
            //update existing record
            const fields = {
                [ID_FIELD.fieldApiName]: this.recordId,
                [MARK_FIELD.fieldApiName]: this.markCurrent,
                [STATUS_FIELD.fieldApiName]: this.statusCurrent,
                [PROOF_FIELD.fieldApiName]: this.proofCurrent,
                [DESCRIPTION_FIELD.fieldApiName]: this.descriptionCurrent,
            };
            const recordInput = { fields };
            updateRecord(recordInput)
                .then(violation => {
                    this.isLoading = false;
                    this.statusPrevious = this.statusCurrent;
                    this.markPrevious = this.markCurrent;
                    this.descriptionPrevious = this.descriptionCurrent;
                    this.proofPrevious = this.proofCurrent;
                    
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Violation updated',
                            variant: 'success',
                        }),
                    );
                })
                .catch(error => {
                    this.isLoading = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error updating record',
                            message: error.body.message,
                            variant: 'error',
                        }),
                    );
                });
        } else {
            //insert new record
            const fields = {
                [MARK_FIELD.fieldApiName]: this.markCurrent,
                [STATUS_FIELD.fieldApiName]: this.statusCurrent,
                [PROOF_FIELD.fieldApiName]: this.proofCurrent,
                [DESCRIPTION_FIELD.fieldApiName]: this.descriptionCurrent,
            };
            const recordInput = { apiName: VIOLATION_OBJECT.objectApiName, fields };
            createRecord(recordInput)
                .then(violation => {
                    this.isLoading = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Violation created',
                            variant: 'success',
                        }),
                    );
                })
                .catch(error => {
                    this.isLoading = false;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error creating record',
                            message: error.body.message,
                            variant: 'error',
                        }),
                    );
                });
        }

    }
    cancel() {
        this.statusCurrent = this.statusPrevious;
        this.markCurrent = this.markPrevious;
        this.descriptionCurrent = this.descriptionPrevious;
        this.proofCurrent = this.proofPrevious;
    }
    sendAlert() {
        console.log('send email');
        console.log(this.recordId)
        sendEmailAlert({recordId: this.recordId})
        .then(data => {
            this.logData = data.map( e => {
                return {
                    time: e.CreatedDate,
                    perfomedBy: e.CreatedBy.Name,
                    action: e.Field.slice(0, -3),
                    details: `${e.OldValue} => ${e.NewValue}`
                }
            })
        })
        .catch(error => {
            console.log('Error while send mail:');
            console.log(error)
        });
    }

    handlePopup() {
        this.isLoading = true;
        getLogs({recordId: this.recordId})
        .then(data => {
            this.logData = data.map(e => {
                const action = /[A-Za-z]+/.exec(e.Field)[0];
                const result = {
                    time: e.CreatedDate,
                    perfomedBy: e.CreatedBy.Name,
                    action: action.charAt(0).toUpperCase() + action.slice(1),
                }
                if(e.OldValue) {
                    result.details = `${e.OldValue} => ${e.NewValue}`
                }
                return result
            })
        })
        .catch(error => {
            console.log('Error while fetching log data:');
            console.log(error)
        });
        this.template.querySelector("section").classList.remove("slds-hide");
        this.template
        .querySelector("div.modalBackdrops")
        .classList.remove("slds-hide");
        this.isLoading = false;
    }
  
    handleSkip() {
      this.template.querySelector("section").classList.add("slds-hide");
      this.template
        .querySelector("div.modalBackdrops")
        .classList.add("slds-hide");
    }
}