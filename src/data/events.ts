/** Recurring signature events shown inside a destination detail sheet. */
export interface DestinationEvent {
  id?: string;
  title: string;
  schedule: string[];
  description: string;
  url?: string;
}

export const EVENTS_BY_DESTINATION: Record<string, DestinationEvent[]> = {
  citron: [
    {
      title: "Sunday Champagne Brunch",
      schedule: ["EVERY SUNDAY", "12:30 – 15:30"],
      description:
        "Enjoy a buffet artfully prepared by our talented chefs, and enjoy our recreational facilities for the whole day. Reservations begin from VND 2.599.000 per person depending on your choice of free flow package.",
      url: "https://www.danang.intercontinental.com/dining/citron/",
    },
    {
      title: "Heavenly Afternoon Tea",
      schedule: ["14:30 – 16:30 (MONDAY – SATURDAY)", "15:30 – 17:00 (SUNDAY)"],
      description:
        "Relish premium teas accompanied by mouthwatering bites. Enhance your experience with free-flow cocktails or champagne. For the ultimate indulgence, book one of our Non-La tables and upgrade to Royal Afternoon Tea, designed to delight all the senses.",
      url: "https://www.danang.intercontinental.com/dining/citron/",
    },
  ],
  "la-maison-1888": [
    {
      title: "Souvenirs de France Wine Tasting",
      schedule: ["MONDAY, WEDNESDAY AND FRIDAY", "16:00 – 17:00"],
      description:
        "Uncork the chapters of some of the most famous vintages at La Maison 1888. France has many wine stories to tell, and our sommeliers love to tell them—and let you taste them! Reservations required by 17:00 the day prior.",
      url: "https://www.danang.intercontinental.com/dining/la-maison-1888/",
    },
  ],
  "terra-mare": [
    {
      title: "Beach BBQ Buffet & Bonfire",
      schedule: ["EVERY SATURDAY", "18:00 – 21:30"],
      description:
        "Join us on the beach for our weekly Barbecue Buffet and Bonfire. Grilled meats and seafood are the stars of the show, accompanied by a tempting selection of side dishes and desserts!",
      url: "https://www.danang.intercontinental.com/dining/terra-mare/",
    },
  ],
};
