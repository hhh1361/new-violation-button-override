public with sharing class UsersSelector {
    @AuraEnabled(cacheable=true)
	public static List<User> selectById(ID id) {
		return [SELECT Name FROM User WHERE Id = :id];
	}
}
