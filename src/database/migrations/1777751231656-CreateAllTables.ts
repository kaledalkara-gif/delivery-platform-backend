import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAllTables1777751231656 implements MigrationInterface {
    name = 'CreateAllTables1777751231656'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."shipments_status_enum" AS ENUM('pending', 'active', 'completed')`);
        await queryRunner.query(`CREATE TABLE "shipments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, "driver_id" uuid NOT NULL, "status" "public"."shipments_status_enum" NOT NULL DEFAULT 'pending', "originAddress" text NOT NULL, "originLatitude" numeric(10,7) NOT NULL, "originLongitude" numeric(10,7) NOT NULL, "destinationAddress" text NOT NULL, "destinationLatitude" numeric(10,7) NOT NULL, "destinationLongitude" numeric(10,7) NOT NULL, "calculatedDistanceKm" numeric(8,2), "estimatedDurationSeconds" integer, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "routeGeometry" text, CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "driver_locations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "driver_id" uuid NOT NULL, "latitude" numeric(10,7) NOT NULL, "longitude" numeric(10,7) NOT NULL, "accuracy" integer, "recordedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_31aae5c417762bf01ec26a53f02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b1cbf387cb66abbc1dc65c346" ON "driver_locations" ("driver_id", "recordedAt") `);
        await queryRunner.query(`CREATE TYPE "public"."drivers_vehicletype_enum" AS ENUM('bicycle', 'small_car', 'large_car', 'van')`);
        await queryRunner.query(`CREATE TYPE "public"."drivers_status_enum" AS ENUM('offline', 'online', 'on_pickup', 'on_delivery', 'on_break')`);
        await queryRunner.query(`CREATE TABLE "drivers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "vehicleType" "public"."drivers_vehicletype_enum" NOT NULL DEFAULT 'small_car', "vehiclePlate" character varying(20), "status" "public"."drivers_status_enum" NOT NULL DEFAULT 'offline', "currentLat" numeric(10,7), "currentLng" numeric(10,7), "maxWeightKg" numeric(8,2) NOT NULL DEFAULT '50', "maxVolumeCm3" integer NOT NULL DEFAULT '50000', "currentWeightKg" numeric(8,2) NOT NULL DEFAULT '0', "currentVolumeCm3" integer NOT NULL DEFAULT '0', "rating" numeric(3,2) NOT NULL DEFAULT '0', "totalDeliveries" integer NOT NULL DEFAULT '0', CONSTRAINT "REL_8e224f1b8f05ace7cfc7c76d03" UNIQUE ("user_id"), CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."packages_type_enum" AS ENUM('envelope', 'small_box', 'medium_box', 'large_carton')`);
        await queryRunner.query(`CREATE TYPE "public"."packages_conditionatpickup_enum" AS ENUM('good', 'minor_damage', 'significant_damage')`);
        await queryRunner.query(`CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, "type" "public"."packages_type_enum" NOT NULL DEFAULT 'small_box', "lengthCm" integer NOT NULL, "widthCm" integer NOT NULL, "heightCm" integer NOT NULL, "volumeCm3" integer NOT NULL, "weightKg" numeric(8,2) NOT NULL, "isFragile" boolean NOT NULL DEFAULT false, "isPerishable" boolean NOT NULL DEFAULT false, "description" text, "conditionAtPickup" "public"."packages_conditionatpickup_enum" NOT NULL DEFAULT 'good', "pickupPhotoUrl" text, "pickupPhotoLocationUrl" text, "deliveryPhotoUrl" text, CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'completed', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'card', 'wallet')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "method" "public"."payments_method_enum" NOT NULL, "stripePaymentIntentId" character varying(255), "stripeTransactionId" character varying(255), "paidAt" TIMESTAMP, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'validated', 'assigned', 'pickup_in_progress', 'pickup_completed', 'with_driver', 'at_depot', 'out_for_delivery', 'delivered', 'failed', 'cancelled', 'returned')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_deliverymode_enum" AS ENUM('express_direct', 'standard_depot')`);
        await queryRunner.query(`CREATE TYPE "public"."orders_timewindowpreference_enum" AS ENUM('asap', 'specific')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "driver_id" uuid, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "deliveryMode" "public"."orders_deliverymode_enum" NOT NULL, "pickupAddress" text NOT NULL, "pickupLatitude" numeric(10,7) NOT NULL, "pickupLongitude" numeric(10,7) NOT NULL, "pickupInstructions" text, "pickupContactName" character varying(100), "pickupContactPhone" character varying(20), "dropoffAddress" text NOT NULL, "dropoffLatitude" numeric(10,7) NOT NULL, "dropoffLongitude" numeric(10,7) NOT NULL, "dropoffInstructions" text, "dropoffContactName" character varying(100), "dropoffContactPhone" character varying(20), "timeWindowPreference" "public"."orders_timewindowpreference_enum" NOT NULL DEFAULT 'asap', "pickupEarliestTime" TIMESTAMP, "pickupLatestTime" TIMESTAMP, "deliveryEarliestTime" TIMESTAMP, "deliveryLatestTime" TIMESTAMP, "totalAmount" numeric(10,2) NOT NULL, "driverEarnings" numeric(10,2) NOT NULL, "platformFee" numeric(10,2) NOT NULL, "assignedAt" TIMESTAMP, "pickupArrivalAt" TIMESTAMP, "pickupCompletedAt" TIMESTAMP, "depotArrivalAt" TIMESTAMP, "depotDepartureAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "deliveryOtp" character varying(6), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('order_created', 'order_assigned', 'order_cancelled', 'pickup_reminder', 'driver_en_route_pickup', 'driver_arrived_pickup', 'package_collected', 'pickup_failed', 'package_at_depot', 'package_dispatched_from_depot', 'driver_en_route_dropoff', 'driver_arrived_dropoff', 'delivery_completed', 'delivery_failed', 'delivery_rescheduled', 'driver_assigned', 'driver_reassigned', 'payment_received', 'payment_failed', 'refund_processed', 'promotion_offer', 'referral_bonus')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channels_enum" AS ENUM('push', 'sms', 'email', 'in_app')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "order_id" uuid, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "body" text NOT NULL, "deepLinkUrl" text, "data" jsonb, "channels" "public"."notifications_channels_enum" array NOT NULL DEFAULT '{push}', "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'normal', "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending', "sentAt" TIMESTAMP, "deliveredAt" TIMESTAMP, "readAt" TIMESTAMP, "smsMessageId" character varying(255), "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "nextRetryAt" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_77d2d971c58759c2e2249ce7d0" ON "notifications" ("status", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a4f82441ed359b5f135a10980" ON "notifications" ("order_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON "notifications" ("user_id", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'driver', 'dispatcher', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "phone" character varying(20), "passwordHash" character varying(255) NOT NULL, "name" character varying(100) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer', "address" text, "defaultPickupLat" numeric(10,7), "defaultPickupLng" numeric(10,7), "isActive" boolean NOT NULL DEFAULT true, "firebaseToken" text, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_templates_type_enum" AS ENUM('order_created', 'order_assigned', 'order_cancelled', 'pickup_reminder', 'driver_en_route_pickup', 'driver_arrived_pickup', 'package_collected', 'pickup_failed', 'package_at_depot', 'package_dispatched_from_depot', 'driver_en_route_dropoff', 'driver_arrived_dropoff', 'delivery_completed', 'delivery_failed', 'delivery_rescheduled', 'driver_assigned', 'driver_reassigned', 'payment_received', 'payment_failed', 'refund_processed', 'promotion_offer', 'referral_bonus')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_templates_defaultchannels_enum" AS ENUM('push', 'sms', 'email', 'in_app')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_templates_defaultpriority_enum" AS ENUM('low', 'normal', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TABLE "notification_templates" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."notification_templates_type_enum" NOT NULL, "defaultTitle" character varying(255) NOT NULL, "defaultBody" text NOT NULL, "defaultChannels" "public"."notification_templates_defaultchannels_enum" array NOT NULL, "defaultPriority" "public"."notification_templates_defaultpriority_enum" NOT NULL DEFAULT 'normal', "isActive" boolean NOT NULL DEFAULT true, "description" text, CONSTRAINT "UQ_39862b1a722590857df5d1b2e3e" UNIQUE ("type"), CONSTRAINT "PK_76f0fc48b8d057d2ae7f3a2848a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_type_enum" AS ENUM('order_created', 'order_assigned', 'order_cancelled', 'pickup_reminder', 'driver_en_route_pickup', 'driver_arrived_pickup', 'package_collected', 'pickup_failed', 'package_at_depot', 'package_dispatched_from_depot', 'driver_en_route_dropoff', 'driver_arrived_dropoff', 'delivery_completed', 'delivery_failed', 'delivery_rescheduled', 'driver_assigned', 'driver_reassigned', 'payment_received', 'payment_failed', 'refund_processed', 'promotion_offer', 'referral_bonus')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_channel_enum" AS ENUM('push', 'sms', 'email', 'in_app')`);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "type" "public"."notification_preferences_type_enum" NOT NULL, "channel" "public"."notification_preferences_channel_enum" NOT NULL, "enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_a6b860a82edad6f41e72d13dd72" UNIQUE ("user_id", "type", "channel"), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."batches_status_enum" AS ENUM('forming', 'ready', 'dispatched', 'completed')`);
        await queryRunner.query(`CREATE TABLE "batches" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "zoneName" character varying(50) NOT NULL, "status" "public"."batches_status_enum" NOT NULL DEFAULT 'forming', "assignedDriverId" uuid, "dispatchedAt" TIMESTAMP, "completedAt" TIMESTAMP, CONSTRAINT "PK_55e7ff646e969b61d37eea5be7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "batch_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "batch_id" uuid NOT NULL, "order_id" uuid NOT NULL, "deliverySequence" integer NOT NULL, "deliveredAt" TIMESTAMP, CONSTRAINT "PK_02ce8e2f2a9b56712677455e28b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_e86fac2a18a75dcb82bfbb23f43" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_eb03f17f7070bb87f741a68684e" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_locations" ADD CONSTRAINT "FK_096de534e1c6301cf7f2a4bf032" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drivers" ADD CONSTRAINT "FK_8e224f1b8f05ace7cfc7c76d03b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "packages" ADD CONSTRAINT "FK_7bbb2e1e292bd4d1f2beb231f4e" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_222cd7bf166a2d7a6aad9cdebee" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_5a4f82441ed359b5f135a109804" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_64c90edc7310c6be7c10c96f675" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "batch_items" ADD CONSTRAINT "FK_4052dad1531c1027609d0f1f06c" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "batch_items" ADD CONSTRAINT "FK_d19ba1d9a395df3557caff56dc5" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "batch_items" DROP CONSTRAINT "FK_d19ba1d9a395df3557caff56dc5"`);
        await queryRunner.query(`ALTER TABLE "batch_items" DROP CONSTRAINT "FK_4052dad1531c1027609d0f1f06c"`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_64c90edc7310c6be7c10c96f675"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_5a4f82441ed359b5f135a109804"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_222cd7bf166a2d7a6aad9cdebee"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "packages" DROP CONSTRAINT "FK_7bbb2e1e292bd4d1f2beb231f4e"`);
        await queryRunner.query(`ALTER TABLE "drivers" DROP CONSTRAINT "FK_8e224f1b8f05ace7cfc7c76d03b"`);
        await queryRunner.query(`ALTER TABLE "driver_locations" DROP CONSTRAINT "FK_096de534e1c6301cf7f2a4bf032"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_eb03f17f7070bb87f741a68684e"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_e86fac2a18a75dcb82bfbb23f43"`);
        await queryRunner.query(`DROP TABLE "batch_items"`);
        await queryRunner.query(`DROP TABLE "batches"`);
        await queryRunner.query(`DROP TYPE "public"."batches_status_enum"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_channel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_type_enum"`);
        await queryRunner.query(`DROP TABLE "notification_templates"`);
        await queryRunner.query(`DROP TYPE "public"."notification_templates_defaultpriority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_templates_defaultchannels_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_templates_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_310667f935698fcd8cb319113a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a4f82441ed359b5f135a10980"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77d2d971c58759c2e2249ce7d0"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channels_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_timewindowpreference_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_deliverymode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "packages"`);
        await queryRunner.query(`DROP TYPE "public"."packages_conditionatpickup_enum"`);
        await queryRunner.query(`DROP TYPE "public"."packages_type_enum"`);
        await queryRunner.query(`DROP TABLE "drivers"`);
        await queryRunner.query(`DROP TYPE "public"."drivers_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."drivers_vehicletype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b1cbf387cb66abbc1dc65c346"`);
        await queryRunner.query(`DROP TABLE "driver_locations"`);
        await queryRunner.query(`DROP TABLE "shipments"`);
        await queryRunner.query(`DROP TYPE "public"."shipments_status_enum"`);
    }

}
