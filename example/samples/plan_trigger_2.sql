DELETE FROM emailmessages where emailmessageid in ( select emailmessageid from emailmessages limit 5000 );
