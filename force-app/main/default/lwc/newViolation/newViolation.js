import { LightningElement, wire, track, api } from 'lwc';
import { createRecord, getRecord  } from 'lightning/uiRecordApi';
import { getPicklistValues , getObjectInfo } from 'lightning/uiObjectInfoApi'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import selectById from '@salesforce/apex/UsersSelector.selectById';
import VIOLATION_OBJECT from '@salesforce/schema/Violation__c';
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
    @api recordTypeId;
    @api recordId;
    
    @api markFieldLabel = 'Mark';
    @api markValue = 'Mark';
    @track markOptions;
    @api inputBackground = "slds-input slds-combobox__input"

    @api statusFieldLabel = 'Status';
    @track statusOptions;
    @api statusValue;

    @api descriptionFieldLabel = 'Description';
    @api descriptionValue;


    @api proofFieldLabel = 'Proof';
    @api proofValue;

    @api nameValue
    @api createdByIdValue
    @api creationDateValue
    @api createdByNameValue

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ data, error }) {
        if (data) {
            console.log(data)
            this.recordTypeId = data.recordTypeId;
            this.markValue = data.fields.Mark__c.value; 
            this.statusValue = data.fields.Status__c.value;
            this.descriptionValue = data.fields.Description__c.value;
            this.proofValue = data.fields.Proof__c.value;
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
        alert("No. of files uploaded : " + uploadedFiles.length);
    }





    changeStatus(event) {
        this.statusValue = event.detail.value;
    }



    togglePicklist(e) {
        if(!e.target.classList.contains('slds-combobox__input')) {
            this.markValue = e.target.getAttribute('title')
            this.inputBackground = `slds-input slds-combobox__input ${/\w+/.exec(this.markValue.toLowerCase())[0]}`
        }
        e.currentTarget.classList.toggle('slds-is-open')
    }




    createViolation() {
        const fields = {};
        fields[NAME_FIELD.fieldApiName] = this.name;
        const recordInput = { apiName: VIOLATION_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(violation => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Violation created',
                        variant: 'success',
                    }),
                );
            })
            .catch(error => {
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