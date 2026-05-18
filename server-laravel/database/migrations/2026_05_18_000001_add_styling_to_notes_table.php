<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->string('color', 50)->nullable()->after('content');
            $table->string('font_family', 50)->nullable()->after('color');
            $table->integer('font_size')->nullable()->after('font_family');
            $table->string('text_color', 50)->nullable()->after('font_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['color', 'font_family', 'font_size', 'text_color']);
        });
    }
};
