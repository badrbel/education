const fs = require('fs');

if (fs.existsSync('data/pipeline/raw/youtube_4am_exercises_raw.json')) {
  const d = JSON.parse(fs.readFileSync('data/pipeline/raw/youtube_4am_exercises_raw.json', 'utf8'));
  console.log('youtube_4am_exercises_raw count:', d.length);
  if (d.length > 0) console.log('Sample exercise raw:', d[0]);
}

if (fs.existsSync('data/pipeline/raw/youtube/discovered_videos.json')) {
  const d = JSON.parse(fs.readFileSync('data/pipeline/raw/youtube/discovered_videos.json', 'utf8'));
  console.log('discovered_videos count:', d.length);
  if (d.length > 0) console.log('Sample discovered_video:', d[0]);
}
