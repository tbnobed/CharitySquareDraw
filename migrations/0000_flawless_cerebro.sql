CREATE TABLE "game_rounds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_number" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"price_per_square" integer DEFAULT 10 NOT NULL,
	"winner_percentage" integer DEFAULT 50 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"winner_square" integer,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"game_round_id" varchar NOT NULL,
	"squares" jsonb NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squares" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"game_round_id" varchar NOT NULL,
	"participant_id" varchar,
	"status" text DEFAULT 'available' NOT NULL,
	"reserved_at" timestamp,
	"sold_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
