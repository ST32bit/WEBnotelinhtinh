<?php
// database/migrations/2024_01_01_000008_fix_users_columns.php
// Fix 1.1: bio nullable + avatar LONGTEXT (Dicebear base64 URLs)

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Fix SQLSTATE[23000]: Column 'bio' cannot be null
            $table->string('bio', 500)->nullable()->default(null)->change();

            // Fix SQLSTATE[22001]: Data too long for column 'avatar'
            // LONGTEXT supports up to 4GB — more than enough for base64 data URIs
            $table->longText('avatar')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('bio', 255)->default('')->change();
            $table->text('avatar')->nullable()->change();
        });
    }
};
