#!/bin/zsh
set -euo pipefail

target_dir="$(cd "$(dirname "$0")/.." && pwd)/resources/audio/shenzhen-hj-2025-grade-2-semester-1"
voice="Eddy (英语（美国）)"
mkdir -p "$target_dir"
temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT

clips=(
  'u01-word-feel|feel'
  'u01-word-see|see'
  'u01-word-smell|smell'
  'u01-word-hear|hear'
  'u01-word-taste|taste'
  'u01-word-kitten|kitten'
  'u01-word-puppy|puppy'
  'u01-word-rabbit|rabbit'
  'u01-word-flowers|flowers'
  'u01-word-egg|egg'
  'u01-line-01|I can see a cat.'
  'u01-line-02|I can hear a cat.'
  'u01-line-03|What can you see?'
  'u01-line-04|Listen!'
  "u01-line-05|You're right."
  'u01-line-06|I can smell flowers.'
  'u01-line-07|Here!'
  'u01-line-08|Now feel this.'
  "u01-line-09|It's hard."
  'u01-line-10|No. Is it a ball?'
  'u01-line-11|Is it an egg?'
  'u01-line-12|Right!'
  'u01-line-13|Feel this.'
  "u01-line-14|Oh, it's soft."
  "u01-line-15|Wow! It's a big bird!"
  'u01-line-16|I can hear a kitten.'
  'u01-line-17|What can you?'
  'u01-line-18|I can.'
  "u01-line-19|It's. They're."
  'u01-line-20|The blind men and the elephant'
  'u01-line-21|Come and feel my elephant.'
  'u01-line-22|Four blind men sit under a tree.'
  "u01-line-23|No. It's soft."
  "u01-line-24|It's thin."
  'u01-line-25|The elephant is hard.'
  "u01-line-26|No. It's thick."
  "u01-line-27|It's."
  'u01-line-28|I have a little cat.'
  "u01-line-29|It's cute and fat."
  'u01-line-30|Where is my cat?'
  "u01-line-31|Oh! It's under my hat."
  'u01-line-32|A man wears a cap.'
  'u01-line-33|He has a map.'
  'u01-line-34|He takes a nap.'
  'u01-line-35|Where is his map?'
  'u01-sound-at|at'
  'u01-sound-ap|ap'
  'u01-inst-01|Listen. Then point and say.'
  'u01-inst-02|Listen and chant.'
  'u01-inst-03|Look, point and say.'
  'u01-inst-04|Guess and circle.'
  'u01-inst-05|What can Daisy see in the show?'
  'u01-inst-06|Read and check.'
  'u01-inst-07|Read and order.'
  'u01-inst-08|Role-play.'
  'u01-inst-09|Colour the picture. Ask and answer.'
  'u01-inst-10|Think: What can you see in the park?'
  'u01-inst-11|Think: What can you learn from this story?'
  'u01-inst-12|The Big Question'
  'u01-inst-13|Sounds'
  'u01-inst-14|What can Daisy see, hear, smell, or feel in the story?'
)

start_index="${1:-1}"
end_index="${2:-${#clips[@]}}"
for ((index = start_index; index <= end_index; index++)); do
  clip="${clips[index]}"
  id="${clip%%|*}"
  text="${clip#*|}"
  for speed in normal slow; do
    rate=175
    [[ "$speed" == "slow" ]] && rate=108
    aiff="$temp_dir/$id-$speed.aiff"
    say -v "$voice" -r "$rate" -o "$aiff" "$text"
    ffmpeg -loglevel error -y -i "$aiff" -c:a aac -b:a 64k "$target_dir/$id.$speed.m4a"
  done
done

print "Created ${#clips[@]} normal and slow audio pairs in $target_dir"
