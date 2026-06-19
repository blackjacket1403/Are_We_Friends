// Concrete, drawable nouns — chosen to work for both Codenames-style cluing
// and Pictionary-style drawing. Keep them tangible; abstract words are no fun to draw.
const WORDS = [
  'Anchor', 'Apple', 'Astronaut', 'Avalanche', 'Axe', 'Backpack', 'Bagpipe', 'Balloon',
  'Bandage', 'Banjo', 'Barrel', 'Basket', 'Bat', 'Beach', 'Beard', 'Beaver', 'Bell',
  'Bicycle', 'Bird', 'Blanket', 'Bomb', 'Bone', 'Boomerang', 'Boot', 'Bottle', 'Bow',
  'Bowl', 'Bridge', 'Broom', 'Bucket', 'Bulb', 'Butterfly', 'Button', 'Cactus', 'Cake',
  'Camera', 'Camel', 'Candle', 'Cannon', 'Canoe', 'Cap', 'Carrot', 'Castle', 'Cat',
  'Caterpillar', 'Chain', 'Chair', 'Cheese', 'Cherry', 'Chest', 'Chimney', 'Church',
  'Clock', 'Cloud', 'Clown', 'Coconut', 'Comb', 'Compass', 'Cookie', 'Cork', 'Crab',
  'Crayon', 'Crocodile', 'Crown', 'Cup', 'Dam', 'Dice', 'Dinosaur', 'Doctor', 'Dog',
  'Dolphin', 'Donut', 'Door', 'Dragon', 'Drum', 'Duck', 'Eagle', 'Ear', 'Egg', 'Elephant',
  'Engine', 'Envelope', 'Eye', 'Fan', 'Feather', 'Fence', 'Ferry', 'Fire', 'Fish',
  'Flag', 'Flamingo', 'Flashlight', 'Flower', 'Flute', 'Fork', 'Fountain', 'Fox', 'Frog',
  'Garden', 'Ghost', 'Giraffe', 'Glasses', 'Globe', 'Glove', 'Goat', 'Guitar', 'Hammer',
  'Hammock', 'Hat', 'Heart', 'Hedgehog', 'Helicopter', 'Helmet', 'Hook', 'Horse',
  'Hourglass', 'House', 'Igloo', 'Island', 'Jacket', 'Jellyfish', 'Kangaroo', 'Kettle',
  'Key', 'Kite', 'Knight', 'Knot', 'Ladder', 'Lamp', 'Lantern', 'Leaf', 'Lemon',
  'Lighthouse', 'Lightning', 'Lion', 'Lipstick', 'Lizard', 'Lobster', 'Lock', 'Magnet',
  'Mailbox', 'Map', 'Mask', 'Match', 'Maze', 'Medal', 'Mermaid', 'Microphone', 'Moon',
  'Mountain', 'Mouse', 'Mushroom', 'Nail', 'Necklace', 'Needle', 'Nest', 'Net', 'Octopus',
  'Onion', 'Owl', 'Paddle', 'Paint', 'Palm', 'Panda', 'Parachute', 'Parrot', 'Peacock',
  'Pencil', 'Penguin', 'Piano', 'Pickle', 'Pie', 'Pig', 'Pillow', 'Pineapple', 'Pirate',
  'Pizza', 'Plane', 'Planet', 'Plug', 'Pocket', 'Pot', 'Potato', 'Pretzel', 'Pumpkin',
  'Puzzle', 'Rabbit', 'Raccoon', 'Radio', 'Raft', 'Rainbow', 'Rake', 'Ring', 'River',
  'Robot', 'Rocket', 'Rope', 'Rose', 'Sailboat', 'Sandwich', 'Saw', 'Scarecrow',
  'Scissors', 'Scorpion', 'Screw', 'Seahorse', 'Seal', 'Shark', 'Sheep', 'Shell', 'Ship',
  'Shoe', 'Shovel', 'Skateboard', 'Skeleton', 'Skull', 'Sled', 'Snail', 'Snake',
  'Snowflake', 'Snowman', 'Sock', 'Spider', 'Spoon', 'Spring', 'Squid', 'Squirrel',
  'Stairs', 'Stamp', 'Star', 'Starfish', 'Statue', 'Stove', 'Strawberry', 'Submarine',
  'Sun', 'Sunflower', 'Swan', 'Sword', 'Table', 'Teapot', 'Telescope', 'Tent', 'Thumb',
  'Tiger', 'Toaster', 'Tomato', 'Tooth', 'Torch', 'Tornado', 'Tractor', 'Train', 'Tree',
  'Triangle', 'Trophy', 'Truck', 'Trumpet', 'Turtle', 'Umbrella', 'Unicorn', 'Vampire',
  'Van', 'Vase', 'Violin', 'Volcano', 'Waffle', 'Wagon', 'Wallet', 'Watch', 'Waterfall',
  'Watermelon', 'Whale', 'Wheel', 'Whistle', 'Windmill', 'Window', 'Witch', 'Wizard',
  'Wolf', 'Worm', 'Wrench', 'Yacht', 'Yarn', 'Zebra', 'Zipper'
];

module.exports = { WORDS };
