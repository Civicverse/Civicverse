# LiveStreamManager.gd
# Handles embedding and syncing of CivicWatch video streams.

extends Node

signal stream_started(stream_url)
signal stream_stopped

func play_stream(stream_url: String):
	emit_signal("stream_started", stream_url)
	print("Connecting to CivicWatch Stream: ", stream_url)

func stop_stream():
	emit_signal("stream_stopped")
