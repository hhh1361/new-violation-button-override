public with sharing class ContentDocumentController {
    @AuraEnabled(cacheable=true)
	public static List<ContentDocument> selectById(List<Id> ids) {
        return [SELECT Id, IsDeleted, CreatedBy.FirstName, CreatedBy.LastName , CreatedDate, LastModifiedDate, LastModifiedBy.FirstName, LastModifiedBy.LastName, Title 
                FROM ContentDocument 
                WHERE Id IN :ids];
	}
}