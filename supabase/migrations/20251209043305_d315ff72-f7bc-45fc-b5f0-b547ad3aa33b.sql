-- Enable realtime for connections table
ALTER TABLE connections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;