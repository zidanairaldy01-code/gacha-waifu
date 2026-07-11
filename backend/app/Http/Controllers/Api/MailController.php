<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Mail;

class MailController extends Controller
{
    public function getMails(Request $request)
    {
        $mails = $request->user()->mails()->orderBy('created_at', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $mails,
        ]);
    }

    public function claimMail(Request $request, $id)
    {
        $user = $request->user();
        $mail = $user->mails()->findOrFail($id);

        if ($mail->is_claimed) {
            return response()->json(['error' => 'Surat ini sudah diklaim.'], 400);
        }

        // Tandai sudah dibaca dan diklaim
        $mail->is_read = true;
        $mail->is_claimed = true;
        $mail->save();

        // Tambahkan hadiah
        if ($mail->reward_gems > 0) {
            $user->gems += $mail->reward_gems;
        }
        if ($mail->reward_tickets > 0) {
            $user->tickets += $mail->reward_tickets;
        }
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Hadiah berhasil diklaim!',
            'mail' => $mail,
            'remaining_gems' => $user->gems,
        ]);
    }
}
