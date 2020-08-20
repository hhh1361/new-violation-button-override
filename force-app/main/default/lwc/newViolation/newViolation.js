import { LightningElement, wire, track, api } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import { getPicklistValues , getObjectInfo } from 'lightning/uiObjectInfoApi'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import VIOLATION_OBJECT from '@salesforce/schema/Violation__c';
import NAME_FIELD from '@salesforce/schema/Violation__c.Name';
import MARK_FIELD from '@salesforce/schema/Violation__c.Mark__c';
import STATUS_FIELD from '@salesforce/schema/Violation__c.Status__c';
import PROOF_FIELD from '@salesforce/schema/Violation__c.Proof__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Violation__c.Description__c';
console.log(MARK_FIELD)


export default class NewViolation extends LightningElement {
    @api objectName = 'Violation__c';
    @api fieldName = 'Mark__c';
    @track fieldLabel;
    @api recordTypeId;
    @api value;
    @track options;
    isAttributeRequired = true;
    apiFieldName;
    markValue = 'Mark'


    @wire(getObjectInfo, { objectApiName: MARK_FIELD.objectApiName })
    getObjectData({ error, data }) {
        if (data) { 
            console.log(data.fields[this.fieldName].label)
            this.recordTypeId = data.defaultRecordTypeId;
            this.apiFieldName = this.objectName + '.' + this.fieldName;
            this.fieldLabel = data.fields[this.fieldName].label;
        } else if (error) {
            console.log('Error:' + error);
        }
    }

    @wire(getPicklistValues, { recordTypeId: '$recordTypeId', fieldApiName: '$apiFieldName' })
    getPicklistValues({ error, data }) {
        if (data) {
            // filter unnecessarry fields from response
            this.options = data.values.map(i => {
                const re = /\w+/
                return {
                    label: i.label,
                    value: i.value,
                    class: `palette ${/\w+/.exec(i.label.toLowerCase())[0]}`
                };
            });

        } else if (error) {
            console.log('Error:' + error);
        }
    }

    handleChange(event) {
        this.value = event.detail.value;
    }



    togglePicklist(e) {
        if(e.target.classList.value !== 'slds-input slds-combobox__input') {
            this.markValue = e.target.getAttribute('title')
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